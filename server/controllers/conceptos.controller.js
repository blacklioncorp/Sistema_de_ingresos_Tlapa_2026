import { db } from '../config/db.js';

export const getConceptos = async (req, res) => {
    try {
        const [conceptos] = await db.query('SELECT * FROM conceptos_cobro ORDER BY area ASC, id ASC');
        res.json({ success: true, conceptos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getConceptosByArea = async (req, res) => {
    const { area } = req.params;
    try {
        const [conceptos] = await db.query("SELECT * FROM conceptos_cobro WHERE area = ? AND activo = TRUE ORDER BY id ASC", [area]);
        res.json({ success: true, conceptos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createConcepto = async (req, res) => {
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
};

export const updateConcepto = async (req, res) => {
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
};

export const deleteConcepto = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM conceptos_cobro WHERE id = ?", [id]);
        res.json({ success: true, message: "Concepto eliminado." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
