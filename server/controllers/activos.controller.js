import { db } from '../config/db.js';

export const updateActivo = async (req, res) => {
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
};

export const transferirActivo = async (req, res) => {
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
};
