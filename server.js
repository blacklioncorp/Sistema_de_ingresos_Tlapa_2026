
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'recaudacion_tlapa',
    waitForConnections: true,
    connectionLimit: 10
}).promise();

// ... (Endpoints de Perfil Completo se mantienen) ...

// --- ENDPOINT: TRANSFERENCIA DE ACTIVO ---
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

        // 1. Actualizar dueño en la tabla del activo
        await connection.query(`UPDATE ${tabla} SET contribuyente_id = ? WHERE id = ?`, [dueño_nuevo_id, activo_id]);

        // 2. Registrar en historial de movimientos
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

// --- ENDPOINT: CORRECCIÓN DE DATOS (EDICIÓN) ---
app.put('/api/activos/editar', async (req, res) => {
    const { tipo_activo, activo_id, nuevos_datos } = req.body;
    
    let query = "";
    let params = [];

    if (tipo_activo === 'predio') {
        query = "UPDATE predios_catastro SET direccion_predio = ?, valor_catastral = ?, clave_catastral = ? WHERE id = ?";
        params = [nuevos_datos.direccion, nuevos_datos.valor, nuevos_datos.clave, activo_id];
    } else if (tipo_activo === 'toma') {
        query = "UPDATE tomas_agua SET numero_contrato = ?, direccion_toma = ?, tipo_servicio = ? WHERE id = ?";
        params = [nuevos_datos.numero, nuevos_datos.direccion, nuevos_datos.tipo, activo_id];
    } else if (tipo_activo === 'licencia') {
        query = "UPDATE licencias_comercio SET nombre_negocio = ?, giro = ?, direccion_local = ? WHERE id = ?";
        params = [nuevos_datos.nombre, nuevos_datos.giro, nuevos_datos.direccion, activo_id];
    }

    try {
        await db.query(query, params);
        res.json({ success: true, message: "Datos actualizados" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3001, () => console.log("Servidor Tlapa corriendo en puerto 3001"));
