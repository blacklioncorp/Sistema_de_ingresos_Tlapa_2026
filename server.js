import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

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
// 1. AUTH (LOGIN)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query(
            "SELECT id, nombre, email, rol, permiso_agua, permiso_catastro, permiso_comercio FROM usuarios WHERE email = ? AND password = ?", 
            [email, password]
        );
        
        if (rows.length > 0) {
            const user = rows[0];
            // Formatamos permisos para que React los entienda
            user.permisos = {
                agua: Boolean(user.permiso_agua),
                catastro: Boolean(user.permiso_catastro),
                comercio: Boolean(user.permiso_comercio)
            };
            res.json({ success: true, user });
        } else {
            res.status(401).json({ error: "Credenciales inválidas" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor de BBDD" });
    }
});

// ==========================================
// 2. CONCEPTOS DE COBRO
// ==========================================
app.get('/api/conceptos/:area', async (req, res) => {
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
app.get('/api/contribuyentes', async (req, res) => {
    try {
        const [contribuyentes] = await db.query("SELECT * FROM contribuyentes ORDER BY nombre_completo");
        res.json({ success: true, contribuyentes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Búsqueda de un contribuyente con TODO su expediente (tomas, predios, licencias)
app.get('/api/contribuyentes/busqueda/:query', async (req, res) => {
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

// Crear nuevo
app.post('/api/contribuyentes', async (req, res) => {
    const { rfc, nombre_completo, direccion, telefono, email } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)",
            [rfc, nombre_completo, direccion, telefono, email]
        );
        res.json({ success: true, id: result.insertId, message: "Contribuyente registrado" });
    } catch (error) {
        // Error de unicidad (RFC duplicado)
        if(error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "El RFC ya existe en el padrón." });
        }
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 4. TRANSACCIONES (PAGOS)
// ==========================================
app.post('/api/pagos/procesar', async (req, res) => {
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

        // 2. Insertamos el detalle por cada concepto cobrado
        for (const item of carrito) {
            await connection.query(
                "INSERT INTO pago_detalles (pago_id, concepto_id, monto, activo_ref) VALUES (?, ?, ?, ?)",
                [pagoId, item.concepto_id, item.monto, item.activo_ref]
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


const PORT = 3001;
app.listen(PORT, () => console.log(`Servidor de Recaudación Tlapa corriendo en http://localhost:${PORT}`));
