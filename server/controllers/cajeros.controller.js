import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';

export const getCajeros = async (req, res) => {
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
};

export const createCajero = async (req, res) => {
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
};

export const updateCajero = async (req, res) => {
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
};

export const deleteCajero = async (req, res) => {
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
};
