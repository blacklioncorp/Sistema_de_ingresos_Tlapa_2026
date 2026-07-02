import { db } from '../config/db.js';

// Buscar adeudos de forma universal
export const buscarAdeudosUniversal = async (req, res) => {
    const { query: searchQuery } = req.query;
    if (!searchQuery || searchQuery.trim() === '') {
        return res.status(400).json({ error: "Falta el parámetro de búsqueda" });
    }

    try {
        const cleanQuery = searchQuery.trim();
        const searchLike = `%${cleanQuery}%`;

        // 1. Intentar buscar contribuyente por RFC exacto o Nombre parcial
        let [contribuyentes] = await db.query(
            "SELECT * FROM contribuyentes WHERE rfc = ? OR nombre_completo ILIKE ? LIMIT 5",
            [cleanQuery.toUpperCase(), searchLike]
        );

        // 2. Si no se encuentra, intentar buscar vinculaciones por Toma de Agua, Predio o Licencia
        if (contribuyentes.length === 0) {
            // Buscar en Tomas de agua
            const [tomas] = await db.query("SELECT contribuyente_id FROM tomas_agua WHERE numero_contrato = ?", [cleanQuery]);
            if (tomas.length > 0) {
                const [users] = await db.query("SELECT * FROM contribuyentes WHERE id = ?", [tomas[0].contribuyente_id]);
                contribuyentes = users;
            }
        }

        if (contribuyentes.length === 0) {
            // Buscar en Predios
            const [predios] = await db.query("SELECT contribuyente_id FROM predios_catastro WHERE clave_catastral = ?", [cleanQuery]);
            if (predios.length > 0) {
                const [users] = await db.query("SELECT * FROM contribuyentes WHERE id = ?", [predios[0].contribuyente_id]);
                contribuyentes = users;
            }
        }

        if (contribuyentes.length === 0) {
            // Buscar en Licencias
            const [licencias] = await db.query("SELECT contribuyente_id FROM licencias_comercio WHERE numero_licencia = ?", [cleanQuery]);
            if (licencias.length > 0) {
                const [users] = await db.query("SELECT * FROM contribuyentes WHERE id = ?", [licencias[0].contribuyente_id]);
                contribuyentes = users;
            }
        }

        if (contribuyentes.length === 0) {
            return res.status(404).json({ error: "No se encontró ningún contribuyente o servicio con ese identificador." });
        }

        // Si se encontraron múltiples contribuyentes por coincidencia de nombre parcial,
        // devolvemos la lista de coincidencias para que el kiosco permita elegir al correcto.
        // Pero si es solo uno, calculamos de una vez todos sus adeudos detallados.
        if (contribuyentes.length > 1) {
            return res.json({
                success: true,
                multiple: true,
                contribuyentes: contribuyentes.map(c => ({ id: c.id, nombre_completo: c.nombre_completo, rfc: c.rfc }))
            });
        }

        const user = contribuyentes[0];
        const id = user.id;
        const ahora = new Date();
        const anioActual = ahora.getFullYear();
        const mesActual = ahora.getMonth() + 1;

        // Calcular deudas de predios
        const [conceptosCatastro] = await db.query("SELECT * FROM conceptos_cobro WHERE area = 'catastro' AND frecuencia_cobro = 'anual' AND activo = TRUE LIMIT 1");
        const precioCatastro = conceptosCatastro.length > 0 ? parseFloat(conceptosCatastro[0].precio) : 1200;
        const conceptoCatastroId = conceptosCatastro.length > 0 ? conceptosCatastro[0].id : 5; // Default de fallback

        const [predios] = await db.query("SELECT * FROM predios_catastro WHERE contribuyente_id = ?", [id]);
        for (let p of predios) {
            const [pagosAnio] = await db.query(
                `SELECT pd.id FROM pago_detalles pd JOIN pagos pa ON pd.pago_id = pa.id WHERE pa.contribuyente_id = ? AND pd.activo_ref = ? AND pd.anio_fiscal = ?`,
                [id, p.clave_catastral, anioActual]
            );
            p.deudas = pagosAnio.length === 0 ? [{
                id: Math.floor(Math.random() * 1000000),
                descripcion: `Impuesto Predial ${anioActual}`,
                monto: precioCatastro,
                fecha_vencimiento: `${anioActual}-12-31`,
                concepto_id: conceptoCatastroId,
                activo_ref: p.clave_catastral,
                frecuencia: 'anual',
                anio_fiscal: anioActual
            }] : [];
        }

        // Calcular deudas de tomas de agua
        const [conceptosAgua] = await db.query("SELECT * FROM conceptos_cobro WHERE area = 'agua' AND frecuencia_cobro = 'mensual' AND activo = TRUE LIMIT 1");
        const precioAgua = conceptosAgua.length > 0 ? parseFloat(conceptosAgua[0].precio) : 150;
        const conceptoAguaId = conceptosAgua.length > 0 ? conceptosAgua[0].id : 1; // Default de fallback

        const [tomas] = await db.query("SELECT * FROM tomas_agua WHERE contribuyente_id = ?", [id]);
        for (let t of tomas) {
            const [pagosMes] = await db.query(
                `SELECT pd.id FROM pago_detalles pd 
                 JOIN pagos pa ON pd.pago_id = pa.id 
                 WHERE pa.contribuyente_id = ? AND pd.activo_ref = ? 
                   AND ((pd.anio_fiscal = ? AND pd.mes_fiscal = ?) OR (pd.anio_fiscal = ? AND pd.mes_fiscal IS NULL))`,
                [id, t.numero_contrato, anioActual, mesActual, anioActual]
            );
            t.deudas = (pagosMes.length === 0 && t.estado !== 'pausado' && t.estado !== 'cancelado')
                ? [{
                    id: Math.floor(Math.random() * 1000000),
                    descripcion: `Mensualidad Agua ${mesActual}/${anioActual}`,
                    monto: precioAgua,
                    fecha_vencimiento: `${anioActual}-${String(mesActual).padStart(2, '0')}-28`,
                    concepto_id: conceptoAguaId,
                    activo_ref: t.numero_contrato,
                    frecuencia: 'mensual',
                    anio_fiscal: anioActual,
                    mes_fiscal: mesActual
                }]
                : [];
        }

        // Calcular deudas de licencias comerciales
        const [conceptosComercio] = await db.query("SELECT * FROM conceptos_cobro WHERE area = 'comercio' AND frecuencia_cobro = 'anual' AND activo = TRUE LIMIT 1");
        const precioComercio = conceptosComercio.length > 0 ? parseFloat(conceptosComercio[0].precio) : 850;
        const conceptoComercioId = conceptosComercio.length > 0 ? conceptosComercio[0].id : 7; // Default de fallback

        const [licencias] = await db.query("SELECT * FROM licencias_comercio WHERE contribuyente_id = ?", [id]);
        for (let l of licencias) {
            const [pagosAnio] = await db.query(
                `SELECT pd.id FROM pago_detalles pd JOIN pagos pa ON pd.pago_id = pa.id WHERE pa.contribuyente_id = ? AND pd.activo_ref = ? AND pd.anio_fiscal = ?`,
                [id, l.numero_licencia, anioActual]
            );
            l.deudas = (pagosAnio.length === 0 && l.estado !== 'cancelado')
                ? [{
                    id: Math.floor(Math.random() * 1000000),
                    descripcion: `Refrendo Licencia ${anioActual}`,
                    monto: precioComercio,
                    fecha_vencimiento: `${anioActual}-03-31`,
                    concepto_id: conceptoComercioId,
                    activo_ref: l.numero_licencia,
                    frecuencia: 'anual',
                    anio_fiscal: anioActual
                }]
                : [];
        }

        res.json({
            success: true,
            multiple: false,
            perfil: {
                ...user,
                predios,
                tomas,
                licencias
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear referencia de pago para el kiosco
export const crearReferencia = async (req, res) => {
    const { contribuyente_id, monto_total, carrito } = req.body;
    if (!contribuyente_id || !carrito || carrito.length === 0) {
        return res.status(400).json({ error: "Faltan datos del contribuyente o carrito" });
    }

    try {
        // Generar un folio único numérico basado en timestamp de 12 dígitos para fácil lectura de escáner
        const timestampPart = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
        const randomPart = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos aleatorios
        const folio = `${timestampPart}${randomPart}`;

        const [result] = await db.query(
            "INSERT INTO referencias_pago (folio, contribuyente_id, monto_total, detalles) VALUES (?, ?, ?, ?)",
            [folio, contribuyente_id, monto_total, JSON.stringify(carrito)]
        );

        res.json({
            success: true,
            folio,
            id: result.insertId,
            message: "Referencia de pago generada exitosamente."
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener referencia por folio
export const obtenerReferenciaPorFolio = async (req, res) => {
    const { folio } = req.params;
    try {
        const [referencias] = await db.query(
            "SELECT * FROM referencias_pago WHERE folio = ?",
            [folio]
        );

        if (referencias.length === 0) {
            return res.status(404).json({ error: "La referencia de pago no existe o ha expirado." });
        }

        const ref = referencias[0];
        if (ref.estado !== 'pendiente') {
            return res.status(400).json({ error: `Esta referencia ya se encuentra en estado: ${ref.estado.toUpperCase()}.` });
        }

        const [contribuyentes] = await db.query(
            "SELECT id, nombre_completo, rfc, direccion FROM contribuyentes WHERE id = ?",
            [ref.contribuyente_id]
        );

        res.json({
            success: true,
            referencia: ref,
            contribuyente: contribuyentes[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
