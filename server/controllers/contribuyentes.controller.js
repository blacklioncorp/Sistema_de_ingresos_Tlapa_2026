import { db } from '../config/db.js';

export const getContribuyentes = async (req, res) => {
    try {
        const { query: searchQuery } = req.query;
        let sql = "SELECT * FROM contribuyentes ORDER BY id DESC LIMIT 150";
        let params = [];

        if (searchQuery && searchQuery.trim() !== '') {
            sql = "SELECT * FROM contribuyentes WHERE nombre_completo ILIKE ? OR rfc ILIKE ? ORDER BY nombre_completo LIMIT 100";
            params = [`%${searchQuery}%`, `%${searchQuery}%`];
        }

        const [contribuyentes] = await db.query(sql, params);
        res.json({ success: true, contribuyentes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getContribuyenteBusquedaUnico = async (req, res) => {
    const search = `%${req.params.query}%`;
    try {
        const [users] = await db.query(
            "SELECT * FROM contribuyentes WHERE nombre_completo ILIKE ? OR rfc ILIKE ? LIMIT 1",
            [search, search]
        );

        if (users.length === 0) return res.status(404).json({ error: "No encontrado" });

        const user = users[0];
        const [predios] = await db.query("SELECT * FROM predios_catastro WHERE contribuyente_id = ?", [user.id]);
        const [tomas] = await db.query("SELECT * FROM tomas_agua WHERE contribuyente_id = ?", [user.id]);
        const [licencias] = await db.query("SELECT * FROM licencias_comercio WHERE contribuyente_id = ?", [user.id]);

        res.json({
            success: true,
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

export const getContribuyenteBusquedaMulti = async (req, res) => {
    const search = `%${req.params.query}%`;
    try {
        const [users] = await db.query(
            "SELECT id, nombre_completo, rfc FROM contribuyentes WHERE nombre_completo ILIKE ? OR rfc ILIKE ? LIMIT 20",
            [search, search]
        );
        res.json({ success: true, contribuyentes: users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getContribuyenteById = async (req, res) => {
    const { id } = req.params;
    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    const mesActual = ahora.getMonth() + 1;

    try {
        const [users] = await db.query("SELECT * FROM contribuyentes WHERE id = ?", [id]);
        if (users.length === 0) return res.status(404).json({ error: "Contribuyente no encontrado" });

        const user = users[0];

        const [conceptosCatastro] = await db.query("SELECT * FROM conceptos_cobro WHERE area = 'catastro' AND frecuencia_cobro = 'anual' LIMIT 1");
        const precioCatastro = conceptosCatastro.length > 0 ? parseFloat(conceptosCatastro[0].precio) : 1200;

        const [conceptosAgua] = await db.query("SELECT * FROM conceptos_cobro WHERE area = 'agua' AND frecuencia_cobro = 'mensual' LIMIT 1");
        const precioAgua = conceptosAgua.length > 0 ? parseFloat(conceptosAgua[0].precio) : 150;

        const [conceptosComercio] = await db.query("SELECT * FROM conceptos_cobro WHERE area = 'comercio' AND frecuencia_cobro = 'anual' LIMIT 1");
        const precioComercio = conceptosComercio.length > 0 ? parseFloat(conceptosComercio[0].precio) : 850;

        const [predios] = await db.query("SELECT * FROM predios_catastro WHERE contribuyente_id = ?", [user.id]);
        for (let p of predios) {
            const [pagosAnio] = await db.query(
                `SELECT pd.id FROM pago_detalles pd JOIN pagos pa ON pd.pago_id = pa.id WHERE pa.contribuyente_id = ? AND pd.activo_ref = ? AND pd.anio_fiscal = ?`,
                [id, p.clave_catastral, anioActual]
            );
            p.deudas = pagosAnio.length === 0 ? [{ id: Date.now() + Math.random(), descripcion: `Impuesto Predial ${anioActual}`, monto: precioCatastro, fecha_vencimiento: `${anioActual}-12-31` }] : [];
        }

        const [tomas] = await db.query("SELECT * FROM tomas_agua WHERE contribuyente_id = ?", [user.id]);
        for (let t of tomas) {
            const [pagosMes] = await db.query(
                `SELECT pd.id FROM pago_detalles pd JOIN pagos pa ON pd.pago_id = pa.id WHERE pa.contribuyente_id = ? AND pd.activo_ref = ? AND ((pd.anio_fiscal = ? AND pd.mes_fiscal = ?) OR (pd.anio_fiscal = ? AND pd.mes_fiscal IS NULL))`,
                [id, t.numero_contrato, anioActual, mesActual, anioActual]
            );
            t.deudas = (pagosMes.length === 0 && t.estado !== 'pausado' && t.estado !== 'cancelado')
                ? [{ id: Date.now() + Math.random(), descripcion: `Mensualidad Agua ${mesActual}/${anioActual}`, monto: precioAgua, fecha_vencimiento: `${anioActual}-${String(mesActual).padStart(2, '0')}-28` }]
                : [];
        }

        const [licencias] = await db.query("SELECT * FROM licencias_comercio WHERE contribuyente_id = ?", [user.id]);
        for (let l of licencias) {
            const [pagosAnio] = await db.query(
                `SELECT pd.id FROM pago_detalles pd JOIN pagos pa ON pd.pago_id = pa.id WHERE pa.contribuyente_id = ? AND pd.activo_ref = ? AND pd.anio_fiscal = ?`,
                [id, l.numero_licencia, anioActual]
            );
            l.deudas = (pagosAnio.length === 0 && l.estado !== 'cancelado')
                ? [{ id: Date.now() + Math.random(), descripcion: `Refrendo Licencia ${anioActual}`, monto: precioComercio, fecha_vencimiento: `${anioActual}-03-31` }]
                : [];
        }

        res.json({ success: true, perfil: { ...user, predios, tomas, licencias } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createContribuyente = async (req, res) => {
    const { rfc, nombre_completo, direccion, telefono, email, latitud, longitud } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [rfc, nombre_completo, direccion, telefono, email, latitud || null, longitud || null]
        );
        res.json({ success: true, id: result.insertId, message: "Contribuyente registrado" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "El RFC ya existe en el padrón." });
        }
        res.status(500).json({ error: error.message });
    }
};

export const deleteContribuyente = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM contribuyentes WHERE id = ?", [id]);
        res.json({ success: true, message: "Contribuyente y todos sus activos fueron eliminados." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateContribuyente = async (req, res) => {
    const { id } = req.params;
    const { rfc, nombre_completo, direccion, telefono, email, latitud, longitud } = req.body;
    try {
        const updates = [];
        const values = [];

        if (rfc !== undefined) { updates.push('rfc = ?'); values.push(rfc); }
        if (nombre_completo !== undefined) { updates.push('nombre_completo = ?'); values.push(nombre_completo); }
        if (direccion !== undefined) { updates.push('direccion = ?'); values.push(direccion); }
        if (telefono !== undefined) { updates.push('telefono = ?'); values.push(telefono); }
        if (email !== undefined) { updates.push('email = ?'); values.push(email); }
        if (latitud !== undefined) { updates.push('latitud = ?'); values.push(latitud); }
        if (longitud !== undefined) { updates.push('longitud = ?'); values.push(longitud); }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No hay campos para actualizar." });
        }

        values.push(id);
        const [result] = await db.query(`UPDATE contribuyentes SET ${updates.join(', ')} WHERE id = ?`, values);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Contribuyente no encontrado." });

        res.json({ success: true, message: "Contribuyente actualizado." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "RFC ya existe." });
        res.status(500).json({ error: error.message });
    }
};

export const createActivoContribuyente = async (req, res) => {
    const { id } = req.params;
    const { tipo } = req.params;
    const d = req.body;

    try {
        let result;
        if (tipo === 'agua') {
            [result] = await db.query(
                "INSERT INTO tomas_agua (numero_contrato, direccion_toma, tipo_servicio, latitud, longitud, contribuyente_id) VALUES (?, ?, ?, ?, ?, ?)",
                [d.numero_contrato, d.direccion_toma, d.tipo_servicio, d.latitud || null, d.longitud || null, id]
            );
        } else if (tipo === 'catastro') {
            [result] = await db.query(
                "INSERT INTO predios_catastro (clave_catastral, direccion_predio, valor_catastral, tipo_predio, latitud, longitud, contribuyente_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [d.clave_catastral, d.ubicacion_predio, d.valor_catastral, 'urbano', d.latitud || null, d.longitud || null, id]
            );
        } else if (tipo === 'comercio') {
            [result] = await db.query(
                "INSERT INTO licencias_comercio (numero_licencia, nombre_negocio, giro, direccion_local, latitud, longitud, contribuyente_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [d.numero_licencia, d.nombre_negocio, d.giro, d.direccion_local, d.latitud || null, d.longitud || null, id]
            );
        } else {
            return res.status(400).json({ error: "Tipo de activo no soportado." });
        }

        res.json({ success: true, id: result.insertId, message: "Activo vinculado correctamente." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Ya existe un activo con ese identificador único (No. Contrato, Clave, Licencia)." });
        }
        res.status(500).json({ error: error.message });
    }
};

export const getEstadoContribuyente = async (req, res) => {
    const { id } = req.params;
    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    const mesActual = ahora.getMonth() + 1;

    try {
        const [tomas] = await db.query('SELECT * FROM tomas_agua WHERE contribuyente_id = ?', [id]);
        const tomasEstado = [];
        for (const toma of tomas) {
            const [pagosMes] = await db.query(
                `SELECT pd.* FROM pago_detalles pd 
                 JOIN pagos p ON pd.pago_id = p.id
                 WHERE p.contribuyente_id = ? AND pd.activo_ref = ? 
                   AND ((pd.anio_fiscal = ? AND pd.mes_fiscal = ?) OR (pd.anio_fiscal = ? AND pd.mes_fiscal IS NULL))`,
                [id, toma.numero_contrato, anioActual, mesActual, anioActual]
            );
            tomasEstado.push({
                ...toma,
                al_corriente: pagosMes.length > 0,
                ultimo_pago: pagosMes.length > 0 ? pagosMes[0] : null
            });
        }

        const [predios] = await db.query('SELECT * FROM predios_catastro WHERE contribuyente_id = ?', [id]);
        const prediosEstado = [];
        for (const predio of predios) {
            const [pagosAnio] = await db.query(
                `SELECT pd.* FROM pago_detalles pd 
                 JOIN pagos p ON pd.pago_id = p.id
                 WHERE p.contribuyente_id = ? AND pd.activo_ref = ? AND pd.anio_fiscal = ?`,
                [id, predio.clave_catastral, anioActual]
            );
            prediosEstado.push({
                ...predio,
                al_corriente: pagosAnio.length > 0,
                ultimo_pago: pagosAnio.length > 0 ? pagosAnio[0] : null
            });
        }

        const [licencias] = await db.query('SELECT * FROM licencias_comercio WHERE contribuyente_id = ?', [id]);
        const licenciasEstado = [];
        for (const lic of licencias) {
            const [pagosAnio] = await db.query(
                `SELECT pd.* FROM pago_detalles pd 
                 JOIN pagos p ON pd.pago_id = p.id
                 WHERE p.contribuyente_id = ? AND pd.activo_ref = ? AND pd.anio_fiscal = ?`,
                [id, lic.numero_licencia, anioActual]
            );
            licenciasEstado.push({
                ...lic,
                al_corriente: pagosAnio.length > 0,
                ultimo_pago: pagosAnio.length > 0 ? pagosAnio[0] : null
            });
        }

        const totalActivos = tomasEstado.length + prediosEstado.length + licenciasEstado.length;
        const totalAlCorriente = [...tomasEstado, ...prediosEstado, ...licenciasEstado].filter(a => a.al_corriente).length;

        res.json({
            success: true,
            anio_fiscal: anioActual,
            mes_actual: mesActual,
            resumen: {
                total_activos: totalActivos,
                al_corriente: totalAlCorriente,
                rezagados: totalActivos - totalAlCorriente,
                estatus_general: totalAlCorriente === totalActivos ? 'AL CORRIENTE' : 'REZAGADO'
            },
            tomas: tomasEstado,
            predios: prediosEstado,
            licencias: licenciasEstado
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
