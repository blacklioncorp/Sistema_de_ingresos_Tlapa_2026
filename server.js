import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'ClaveSuperSecretaTlapa2026';

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DE BASE DE DATOS
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',      // <- Ajustar a tu usuario MySQL
    password: '',      // <- Ajustar si tienes contraseña en MySQL
    database: 'recaudacion_tlapa',
    waitForConnections: true,
    connectionLimit: 10
}).promise();

// ==========================================
// MIDDLEWARE: VERIFICAR TOKEN JWT
// ==========================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: "Acceso denegado: Token requerido" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "El token es inválido o ha expirado" });
        req.user = user;
        next();
    });
}

// ==========================================
// 1. AUTH (LOGIN)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query(
            "SELECT id, nombre, email, password as hash, rol, permiso_agua, permiso_catastro, permiso_comercio, activo FROM usuarios WHERE email = ?",
            [email]
        );

        if (rows.length > 0) {
            const user = rows[0];
            const validPassword = await bcrypt.compare(password, user.hash);

            if (validPassword) {
                // Verificar si el usuario está activo
                if (!user.activo) {
                    return res.status(403).json({ error: "Tu acceso ha sido deshabilitado por un administrador." });
                }

                user.permisos = {
                    agua: Boolean(user.permiso_agua),
                    catastro: Boolean(user.permiso_catastro),
                    comercio: Boolean(user.permiso_comercio)
                };
                delete user.hash; // Nunca devolvemos el hash al cliente

                // Generamos Token JWT (Expira en 12 horas)
                const token = jwt.sign(
                    { id: user.id, email: user.email, rol: user.rol, permisos: user.permisos },
                    JWT_SECRET,
                    { expiresIn: '12h' }
                );

                res.json({ success: true, token, user });
            } else {
                res.status(401).json({ error: "Contraseña incorrecta" });
            }
        } else {
            res.status(401).json({ error: "Usuario no encontrado en el sistema" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
    }
});

// ==========================================
// 1B. DASHBOARD (ESTADÍSTICAS REALES)
// ==========================================

// Estadísticas del día / mes
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        // Recaudación de HOY
        const [recaudHoy] = await db.query(
            "SELECT COALESCE(SUM(monto_total), 0) as total FROM pagos WHERE DATE(fecha_pago) = CURDATE()"
        );

        // Recaudación del MES ACTUAL
        const [recaudMes] = await db.query(
            "SELECT COALESCE(SUM(monto_total), 0) as total FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE())"
        );

        // Recaudación del MES ANTERIOR (para variación)
        const [recaudMesAnterior] = await db.query(
            "SELECT COALESCE(SUM(monto_total), 0) as total FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(fecha_pago) = YEAR(CURDATE() - INTERVAL 1 MONTH)"
        );

        // Contribuyentes registrados (total)
        const [totalContribuyentes] = await db.query(
            "SELECT COUNT(*) as total FROM contribuyentes"
        );

        // Contribuyentes nuevos HOY
        const [nuevosHoy] = await db.query(
            "SELECT COUNT(*) as total FROM contribuyentes WHERE DATE(creado_en) = CURDATE()"
        );

        // Pagos realizados HOY (cantidad de transacciones)
        const [pagosHoy] = await db.query(
            "SELECT COUNT(*) as total FROM pagos WHERE DATE(fecha_pago) = CURDATE()"
        );

        // Pagos realizados este MES
        const [pagosMes] = await db.query(
            "SELECT COUNT(*) as total FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE())"
        );

        // Recaudación por área HOY
        const [recaudPorArea] = await db.query(
            `SELECT cc.area, COALESCE(SUM(pd.monto), 0) as total
             FROM pago_detalles pd
             JOIN conceptos_cobro cc ON pd.concepto_id = cc.id
             JOIN pagos p ON pd.pago_id = p.id
             WHERE DATE(p.fecha_pago) = CURDATE()
             GROUP BY cc.area`
        );

        // Calcular variación mensual
        const mesActual = parseFloat(recaudMes[0].total);
        const mesAnterior = parseFloat(recaudMesAnterior[0].total);
        let variacion = 0;
        if (mesAnterior > 0) {
            variacion = ((mesActual - mesAnterior) / mesAnterior) * 100;
        } else if (mesActual > 0) {
            variacion = 100;
        }

        // Recaudación semanal (últimos 7 días)
        const [recaudSemanal] = await db.query(
            `SELECT DATE(fecha_pago) as dia, COALESCE(SUM(monto_total), 0) as total
             FROM pagos
             WHERE fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
             GROUP BY DATE(fecha_pago)
             ORDER BY dia ASC`
        );

        // Llenar los 7 días (puede haber días sin ventas)
        const diasSemana = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = recaudSemanal.find(r => {
                const rDate = new Date(r.dia).toISOString().split('T')[0];
                return rDate === dateStr;
            });
            diasSemana.push({
                dia: dateStr,
                dia_nombre: d.toLocaleDateString('es-MX', { weekday: 'short' }),
                total: found ? parseFloat(found.total) : 0
            });
        }

        res.json({
            success: true,
            recaudacion_hoy: parseFloat(recaudHoy[0].total),
            recaudacion_mes: mesActual,
            variacion_mensual: parseFloat(variacion.toFixed(1)),
            total_contribuyentes: totalContribuyentes[0].total,
            nuevos_contribuyentes_hoy: nuevosHoy[0].total,
            pagos_hoy: pagosHoy[0].total,
            pagos_mes: pagosMes[0].total,
            recaudacion_por_area: recaudPorArea,
            recaudacion_semanal: diasSemana
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actividad reciente (últimos pagos)
app.get('/api/dashboard/actividad', authenticateToken, async (req, res) => {
    try {
        const [actividad] = await db.query(
            `SELECT p.id, p.monto_total, p.fecha_pago, p.notas,
                    u.nombre as cajero_nombre,
                    c.nombre_completo as contribuyente_nombre, c.rfc
             FROM pagos p
             JOIN usuarios u ON p.cajero_id = u.id
             LEFT JOIN contribuyentes c ON p.contribuyente_id = c.id
             ORDER BY p.fecha_pago DESC
             LIMIT 10`
        );
        res.json({ success: true, actividad });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 1C. REPORTES DE RECAUDACIÓN
// ==========================================
app.get('/api/reportes', authenticateToken, async (req, res) => {
    const { desde, hasta } = req.query;

    // Default: mes actual
    const ahora = new Date();
    const primerDiaMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`;
    const fechaDesde = desde || primerDiaMes;
    const fechaHasta = hasta || ahora.toISOString().split('T')[0];

    try {
        // Recaudación total en el período
        const [totalPeriodo] = await db.query(
            "SELECT COALESCE(SUM(monto_total), 0) as total, COUNT(*) as num_pagos FROM pagos WHERE DATE(fecha_pago) BETWEEN ? AND ?",
            [fechaDesde, fechaHasta]
        );

        // Recaudación por área
        const [porArea] = await db.query(
            `SELECT cc.area, COALESCE(SUM(pd.monto), 0) as total, COUNT(DISTINCT pd.pago_id) as num_pagos
             FROM pago_detalles pd
             JOIN conceptos_cobro cc ON pd.concepto_id = cc.id
             JOIN pagos p ON pd.pago_id = p.id
             WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
             GROUP BY cc.area
             ORDER BY total DESC`,
            [fechaDesde, fechaHasta]
        );

        // Top conceptos más cobrados
        const [topConceptos] = await db.query(
            `SELECT cc.nombre, cc.area, COALESCE(SUM(pd.monto), 0) as total, COUNT(*) as cantidad
             FROM pago_detalles pd
             JOIN conceptos_cobro cc ON pd.concepto_id = cc.id
             JOIN pagos p ON pd.pago_id = p.id
             WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
             GROUP BY pd.concepto_id, cc.nombre, cc.area
             ORDER BY total DESC
             LIMIT 10`,
            [fechaDesde, fechaHasta]
        );

        // Recaudación diaria (timeline)
        const [diaria] = await db.query(
            `SELECT DATE(fecha_pago) as dia, COALESCE(SUM(monto_total), 0) as total, COUNT(*) as num_pagos
             FROM pagos
             WHERE DATE(fecha_pago) BETWEEN ? AND ?
             GROUP BY DATE(fecha_pago)
             ORDER BY dia ASC`,
            [fechaDesde, fechaHasta]
        );

        // Top cajeros
        const [topCajeros] = await db.query(
            `SELECT u.nombre, COALESCE(SUM(p.monto_total), 0) as total, COUNT(*) as num_pagos
             FROM pagos p
             JOIN usuarios u ON p.cajero_id = u.id
             WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
             GROUP BY p.cajero_id, u.nombre
             ORDER BY total DESC
             LIMIT 5`,
            [fechaDesde, fechaHasta]
        );

        const totalGeneral = parseFloat(totalPeriodo[0].total);
        const areasConPorcentaje = porArea.map(a => ({
            area: a.area,
            total: parseFloat(a.total),
            num_pagos: a.num_pagos,
            porcentaje: totalGeneral > 0 ? parseFloat(((parseFloat(a.total) / totalGeneral) * 100).toFixed(1)) : 0
        }));

        res.json({
            success: true,
            periodo: { desde: fechaDesde, hasta: fechaHasta },
            resumen: {
                total: totalGeneral,
                num_pagos: totalPeriodo[0].num_pagos,
                promedio_ticket: totalPeriodo[0].num_pagos > 0 ? parseFloat((totalGeneral / totalPeriodo[0].num_pagos).toFixed(2)) : 0
            },
            por_area: areasConPorcentaje,
            top_conceptos: topConceptos.map(c => ({ ...c, total: parseFloat(c.total) })),
            recaudacion_diaria: diaria.map(d => ({ ...d, total: parseFloat(d.total) })),
            top_cajeros: topCajeros.map(c => ({ ...c, total: parseFloat(c.total) }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 2. CONCEPTOS DE COBRO
// ==========================================
app.get('/api/conceptos/:area', authenticateToken, async (req, res) => {
    const { area } = req.params;
    try {
        const [conceptos] = await db.query("SELECT * FROM conceptos_cobro WHERE area = ? AND activo = TRUE", [area]);
        res.json({ success: true, conceptos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 3. CONTRIBUYENTES
// ==========================================
app.get('/api/contribuyentes', authenticateToken, async (req, res) => {
    try {
        const { query: searchQuery } = req.query;
        let sql = "SELECT * FROM contribuyentes ORDER BY id DESC LIMIT 150";
        let params = [];

        if (searchQuery && searchQuery.trim() !== '') {
            sql = "SELECT * FROM contribuyentes WHERE nombre_completo LIKE ? OR rfc LIKE ? ORDER BY nombre_completo LIMIT 100";
            params = [`%${searchQuery}%`, `%${searchQuery}%`];
        }

        const [contribuyentes] = await db.query(sql, params);
        res.json({ success: true, contribuyentes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Búsqueda de un contribuyente con TODO su expediente (tomas, predios, licencias) (UNICO: el primero)
app.get('/api/contribuyentes/busqueda/:query', authenticateToken, async (req, res) => {
    const search = `%${req.params.query}%`;
    try {
        const [users] = await db.query(
            "SELECT * FROM contribuyentes WHERE nombre_completo LIKE ? OR rfc LIKE ? LIMIT 1",
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
});

// Búsqueda MULTIPLE de contribuyentes por nombre o RFC
app.get('/api/contribuyentes/busqueda/multi/:query', authenticateToken, async (req, res) => {
    const search = `%${req.params.query}%`;
    try {
        const [users] = await db.query(
            "SELECT id, nombre_completo, rfc FROM contribuyentes WHERE nombre_completo LIKE ? OR rfc LIKE ? LIMIT 20",
            [search, search]
        );
        res.json({ success: true, contribuyentes: users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener expediente por ID
app.get('/api/contribuyentes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    const mesActual = ahora.getMonth() + 1;

    try {
        const [users] = await db.query("SELECT * FROM contribuyentes WHERE id = ?", [id]);
        if (users.length === 0) return res.status(404).json({ error: "Contribuyente no encontrado" });

        const user = users[0];

        // Obtener catálogos para precios
        const [conceptosCatastro] = await db.query("SELECT * FROM conceptos_cobro WHERE area = 'catastro' AND frecuencia_cobro = 'anual' LIMIT 1");
        const precioCatastro = conceptosCatastro.length > 0 ? parseFloat(conceptosCatastro[0].precio) : 1200;

        const [conceptosAgua] = await db.query("SELECT * FROM conceptos_cobro WHERE area = 'agua' AND frecuencia_cobro = 'mensual' LIMIT 1");
        const precioAgua = conceptosAgua.length > 0 ? parseFloat(conceptosAgua[0].precio) : 150;

        const [conceptosComercio] = await db.query("SELECT * FROM conceptos_cobro WHERE area = 'comercio' AND frecuencia_cobro = 'anual' LIMIT 1");
        const precioComercio = conceptosComercio.length > 0 ? parseFloat(conceptosComercio[0].precio) : 850;

        // 1. Predios
        const [predios] = await db.query("SELECT * FROM predios_catastro WHERE contribuyente_id = ?", [user.id]);
        for (let p of predios) {
            const [pagosAnio] = await db.query(
                `SELECT pd.id FROM pago_detalles pd JOIN pagos pa ON pd.pago_id = pa.id WHERE pa.contribuyente_id = ? AND pd.activo_ref = ? AND pd.anio_fiscal = ?`,
                [id, p.clave_catastral, anioActual]
            );
            p.deudas = pagosAnio.length === 0 ? [{ id: Date.now() + Math.random(), descripcion: `Impuesto Predial ${anioActual}`, monto: precioCatastro, fecha_vencimiento: `${anioActual}-12-31` }] : [];
        }

        // 2. Tomas
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

        // 3. Licencias
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
});

// Crear nuevo contribuyente
app.post('/api/contribuyentes', authenticateToken, async (req, res) => {
    const { rfc, nombre_completo, direccion, telefono, email, latitud, longitud } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [rfc, nombre_completo, direccion, telefono, email, latitud || null, longitud || null]
        );
        res.json({ success: true, id: result.insertId, message: "Contribuyente registrado" });
    } catch (error) {
        // Error de unicidad (RFC duplicado)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "El RFC ya existe en el padrón." });
        }
        res.status(500).json({ error: error.message });
    }
});

// Borrar contribuyente (DELETE)
app.delete('/api/contribuyentes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM contribuyentes WHERE id = ?", [id]);
        res.json({ success: true, message: "Contribuyente y todos sus activos fueron eliminados." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar contribuyente (PUT)
app.put('/api/contribuyentes/:id', authenticateToken, async (req, res) => {
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
});

// Actualizar activo (incluyendo estado)
app.put('/api/activos/:tipo/:id', authenticateToken, async (req, res) => {
    const { tipo, id } = req.params;
    const d = req.body;

    try {
        let tabla = '';
        const updates = [];
        const values = [];

        if (tipo === 'agua') {
            tabla = 'tomas_agua';
            if (d.numero_contrato !== undefined) { updates.push('numero_contrato = ?'); values.push(d.numero_contrato); }
            if (d.direccion_toma !== undefined) { updates.push('direccion_toma = ?'); values.push(d.direccion_toma); }
            if (d.tipo_servicio !== undefined) { updates.push('tipo_servicio = ?'); values.push(d.tipo_servicio); }
            if (d.estado !== undefined) { updates.push('estado = ?'); values.push(d.estado); }
        } else if (tipo === 'catastro') {
            tabla = 'predios_catastro';
            if (d.clave_catastral !== undefined) { updates.push('clave_catastral = ?'); values.push(d.clave_catastral); }
            if (d.direccion_predio !== undefined) { updates.push('direccion_predio = ?'); values.push(d.direccion_predio); }
            if (d.valor_catastral !== undefined) { updates.push('valor_catastral = ?'); values.push(d.valor_catastral); }
            if (d.tipo_predio !== undefined) { updates.push('tipo_predio = ?'); values.push(d.tipo_predio); }
        } else if (tipo === 'comercio') {
            tabla = 'licencias_comercio';
            if (d.numero_licencia !== undefined) { updates.push('numero_licencia = ?'); values.push(d.numero_licencia); }
            if (d.nombre_negocio !== undefined) { updates.push('nombre_negocio = ?'); values.push(d.nombre_negocio); }
            if (d.giro !== undefined) { updates.push('giro = ?'); values.push(d.giro); }
            if (d.direccion_local !== undefined) { updates.push('direccion_local = ?'); values.push(d.direccion_local); }
            if (d.estado !== undefined) { updates.push('estado = ?'); values.push(d.estado); }
        } else {
            return res.status(400).json({ error: "Tipo de activo no soportado." });
        }

        if (d.latitud !== undefined) { updates.push('latitud = ?'); values.push(d.latitud); }
        if (d.longitud !== undefined) { updates.push('longitud = ?'); values.push(d.longitud); }

        if (updates.length === 0) return res.status(400).json({ error: "No hay campos para actualizar." });

        values.push(id);
        const [result] = await db.query(`UPDATE ${tabla} SET ${updates.join(', ')} WHERE id = ?`, values);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Activo no encontrado." });

        res.json({ success: true, message: "Activo actualizado." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "El identificador del activo ya existe." });
        res.status(500).json({ error: error.message });
    }
});

// Vincular nuevo activo a un contribuyente existente
app.post('/api/contribuyentes/:id/activos/:tipo', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { tipo } = req.params;
    const d = req.body; // los datos específicos

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
});

// ==========================================
// 3B. GESTIÓN DE CAJEROS (CRUD COMPLETO)
// ==========================================

// Listar todos los cajeros
app.get('/api/cajeros', authenticateToken, async (req, res) => {
    try {
        const [cajeros] = await db.query(
            "SELECT id, nombre, email, rol, permiso_agua, permiso_catastro, permiso_comercio, activo FROM usuarios WHERE rol = 'cajero' ORDER BY nombre"
        );
        const mapped = cajeros.map(c => ({
            id: c.id,
            nombre: c.nombre,
            email: c.email,
            rol: c.rol,
            activo: Boolean(c.activo),
            permisos: {
                agua: Boolean(c.permiso_agua),
                catastro: Boolean(c.permiso_catastro),
                comercio: Boolean(c.permiso_comercio)
            }
        }));
        res.json({ success: true, cajeros: mapped });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear nuevo cajero
app.post('/api/cajeros', authenticateToken, async (req, res) => {
    const { nombre, email, password, permiso_agua, permiso_catastro, permiso_comercio } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            `INSERT INTO usuarios (nombre, email, password, rol, permiso_agua, permiso_catastro, permiso_comercio) 
             VALUES (?, ?, ?, 'cajero', ?, ?, ?)`,
            [nombre, email, hashedPassword, permiso_agua || false, permiso_catastro || false, permiso_comercio || false]
        );
        res.json({ success: true, id: result.insertId, message: "Cajero registrado exitosamente." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Ya existe un usuario con ese email." });
        }
        res.status(500).json({ error: error.message });
    }
});

// Actualizar permisos de un cajero
app.put('/api/cajeros/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { permiso_agua, permiso_catastro, permiso_comercio, activo, nombre, email } = req.body;

    try {
        const updates = [];
        const values = [];

        if (permiso_agua !== undefined) { updates.push('permiso_agua = ?'); values.push(permiso_agua); }
        if (permiso_catastro !== undefined) { updates.push('permiso_catastro = ?'); values.push(permiso_catastro); }
        if (permiso_comercio !== undefined) { updates.push('permiso_comercio = ?'); values.push(permiso_comercio); }
        if (activo !== undefined) { updates.push('activo = ?'); values.push(activo); }
        if (nombre) { updates.push('nombre = ?'); values.push(nombre); }
        if (email) { updates.push('email = ?'); values.push(email); }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No hay campos para actualizar." });
        }

        values.push(id);
        await db.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ? AND rol = 'cajero'`, values);
        res.json({ success: true, message: "Cajero actualizado." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Ya existe un usuario con ese email." });
        }
        res.status(500).json({ error: error.message });
    }
});

// Eliminar cajero
app.delete('/api/cajeros/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("DELETE FROM usuarios WHERE id = ? AND rol = 'cajero'", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Cajero no encontrado o no tiene rol de cajero." });
        }
        res.json({ success: true, message: "Acceso de cajero eliminado." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 4. TRANSACCIONES (PAGOS)
// ==========================================
app.post('/api/pagos/procesar', authenticateToken, async (req, res) => {
    const { cajero_id, contribuyente_id, monto_total, notas, carrito } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insertamos el pago principal (Cabecera)
        const [pagoResult] = await connection.query(
            "INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, notas) VALUES (?, ?, ?, ?)",
            [cajero_id, contribuyente_id, monto_total, notas]
        );
        const pagoId = pagoResult.insertId;

        // 2. Insertamos el detalle por cada concepto cobrado con su periodo fiscal
        for (const item of carrito) {
            // Calcular periodo cubierto según la frecuencia del concepto
            let periodoInicio = null, periodoFin = null, anioFiscal = null, mesFiscal = null;
            const ahora = new Date();

            if (item.frecuencia === 'mensual') {
                // Pago mensual: cubre el mes indicado (o el actual si no se especifica)
                const mes = item.mes_fiscal || (ahora.getMonth() + 1);
                const anio = item.anio_fiscal || ahora.getFullYear();
                anioFiscal = anio;
                mesFiscal = mes;
                periodoInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
                const ultimoDia = new Date(anio, mes, 0).getDate();
                periodoFin = `${anio}-${String(mes).padStart(2, '0')}-${ultimoDia}`;
            } else if (item.frecuencia === 'anual') {
                // Pago anual: cubre todo el año fiscal
                const anio = item.anio_fiscal || ahora.getFullYear();
                anioFiscal = anio;
                mesFiscal = null;
                periodoInicio = `${anio}-01-01`;
                periodoFin = `${anio}-12-31`;
            }
            // 'unico' no tiene periodo (conexiones, reconexiones, certificados)

            await connection.query(
                `INSERT INTO pago_detalles 
                 (pago_id, concepto_id, monto, activo_ref, periodo_inicio, periodo_fin, anio_fiscal, mes_fiscal) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [pagoId, item.concepto_id, item.monto, item.activo_ref, periodoInicio, periodoFin, anioFiscal, mesFiscal]
            );
        }

        await connection.commit();
        res.json({ success: true, message: "Pago procesado y timbrado correctamente", folio: pagoId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: "Falló la transacción: " + error.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// 5. ESTADO DE PAGO DE UN CONTRIBUYENTE
// ==========================================
app.get('/api/contribuyentes/estado/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    const mesActual = ahora.getMonth() + 1;

    try {
        // Obtener tomas de agua del contribuyente
        const [tomas] = await db.query('SELECT * FROM tomas_agua WHERE contribuyente_id = ?', [id]);
        const tomasEstado = [];
        for (const toma of tomas) {
            // Revisa si tiene pago del mes actual (mensual) O del año actual (anual)
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

        // Obtener predios
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

        // Obtener licencias
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
});



// ==========================================
// 5. INFRAESTRUCTURA DE TRANSFERENCIAS DE DOMINIO
// ==========================================
app.post('/api/activos/transferir', async (req, res) => {
    const { tipo_activo, activo_id, dueño_anterior_id, dueño_nuevo_id, admin_id, motivo } = req.body;

    let tabla = '';
    if (tipo_activo === 'predio') tabla = 'predios_catastro';
    else if (tipo_activo === 'toma') tabla = 'tomas_agua';
    else if (tipo_activo === 'licencia') tabla = 'licencias_comercio';
    else return res.status(400).json({ error: "Tipo de activo inválido" });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(`UPDATE ${tabla} SET contribuyente_id = ? WHERE id = ?`, [dueño_nuevo_id, activo_id]);

        await connection.query(`
            INSERT INTO historial_movimientos 
            (activo_id, tipo_activo, dueño_anterior_id, dueño_nuevo_id, admin_id, motivo)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [activo_id, tipo_activo, dueño_anterior_id, dueño_nuevo_id, admin_id, motivo || 'Transferencia de dominio estándar']);

        await connection.commit();
        res.json({ success: true, message: "Activo transferido y bitácora actualizada" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});


// ==========================================
// 8. METODOS CRUD PARA CONCEPTOS DE COBRO
// ==========================================
app.get('/api/conceptos', authenticateToken, async (req, res) => {
    try {
        const [conceptos] = await db.query('SELECT * FROM conceptos_cobro ORDER BY area ASC, id ASC');
        res.json({ success: true, conceptos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/conceptos', authenticateToken, async (req, res) => {
    const { clave, area, nombre, precio, calculado, frecuencia_cobro } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO conceptos_cobro (clave, area, nombre, precio, calculado, frecuencia_cobro) VALUES (?, ?, ?, ?, ?, ?)",
            [clave, area, nombre, precio, calculado, frecuencia_cobro]
        );
        res.json({ success: true, message: "Concepto registrado", id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "Esa clave ya existe." });
        res.status(500).json({ error: error.message });
    }
});

// Obtener conceptos por área específica (agua, catastro, comercio)
app.get('/api/conceptos/:area', authenticateToken, async (req, res) => {
    const { area } = req.params;
    try {
        const [conceptos] = await db.query('SELECT * FROM conceptos_cobro WHERE area = ? ORDER BY id ASC', [area]);
        res.json({ success: true, conceptos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 9. METODOS PARA MAPA DE COBERTURA
// ==========================================
app.get('/api/mapa/cobertura', authenticateToken, async (req, res) => {
    try {
        const queryEstadoPago = `
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM pago_detalles pd 
                    JOIN pagos p ON pd.pago_id = p.id
                    WHERE pd.activo_ref = ?
                    AND pd.periodo_fin >= CURRENT_DATE()
                ) THEN 'cumplidor'
                WHEN EXISTS (
                    SELECT 1 FROM pago_detalles pd 
                    JOIN pagos p ON pd.pago_id = p.id
                    WHERE pd.activo_ref = ?
                ) THEN 'moroso'
                ELSE 'desconocido'
            END as estado_pago
        `;

        const [agua] = await db.query(`
            SELECT t.id, t.numero_contrato as identificador, t.tipo_servicio as extradata, t.latitud, t.longitud, c.nombre_completo as contribuyente, 'agua' as tipo,
            REPLACE(${queryEstadoPago}, '?', t.numero_contrato) as estado_pago_computed
            FROM tomas_agua t
            JOIN contribuyentes c ON t.contribuyente_id = c.id
            WHERE t.latitud IS NOT NULL AND t.longitud IS NOT NULL
        `);
        // Workaround for dynamic replace in query
        const aguaParsed = agua.map(a => ({ ...a, estado_pago: 'desconocido' }));

        const [catastro] = await db.query(`
            SELECT p.id, p.clave_catastral as identificador, p.tipo_predio as extradata, p.latitud, p.longitud, c.nombre_completo as contribuyente, 'catastro' as tipo
            FROM predios_catastro p
            JOIN contribuyentes c ON p.contribuyente_id = c.id
            WHERE p.latitud IS NOT NULL AND p.longitud IS NOT NULL
        `);
        const catastroParsed = catastro.map(a => ({ ...a, estado_pago: 'desconocido' }));

        const [comercio] = await db.query(`
            SELECT l.id, l.numero_licencia as identificador, l.giro as extradata, l.latitud, l.longitud, c.nombre_completo as contribuyente, 'comercio' as tipo
            FROM licencias_comercio l
            JOIN contribuyentes c ON l.contribuyente_id = c.id
            WHERE l.latitud IS NOT NULL AND l.longitud IS NOT NULL
        `);
        const comercioParsed = comercio.map(a => ({ ...a, estado_pago: 'desconocido' }));

        // Fetch all pago_detalles to map them manually in JS for reliable state computation
        const [pagos] = await db.query("SELECT activo_ref, MAX(periodo_fin) as ultimo_periodo FROM pago_detalles GROUP BY activo_ref");
        const pagosMap = new Map();
        pagos.forEach(p => pagosMap.set(p.activo_ref, new Date(p.ultimo_periodo)));

        const now = new Date();

        const calculateState = (items) => {
            return items.map(item => {
                const ultimoPago = pagosMap.get(item.identificador);
                let estado_pago = 'desconocido';
                if (ultimoPago) {
                    estado_pago = ultimoPago >= now ? 'cumplidor' : 'moroso';
                }
                return { ...item, estado_pago };
            });
        };

        const [sinUbicacion] = await db.query(`
            SELECT id, nombre_completo, direccion 
            FROM contribuyentes 
            WHERE latitud IS NULL OR longitud IS NULL
            LIMIT 200
        `);

        res.json({
            success: true,
            agua: calculateState(aguaParsed),
            catastro: calculateState(catastroParsed),
            comercio: calculateState(comercioParsed),
            sinUbicacion
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/conceptos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { clave, area, nombre, precio, calculado, frecuencia_cobro } = req.body;
    try {
        await db.query(
            "UPDATE conceptos_cobro SET clave=?, area=?, nombre=?, precio=?, calculado=?, frecuencia_cobro=? WHERE id=?",
            [clave, area, nombre, precio, calculado, frecuencia_cobro, id]
        );
        res.json({ success: true, message: "Concepto actualizado." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "Esa clave ya existe." });
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/conceptos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM conceptos_cobro WHERE id = ?", [id]);
        res.json({ success: true, message: "Concepto eliminado." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Servidor de Recaudación Tlapa corriendo en http://localhost:${PORT}`));
