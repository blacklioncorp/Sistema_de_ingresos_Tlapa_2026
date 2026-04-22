import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const loginUsuario = async (req, res) => {
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
                if (!user.activo) {
                    return res.status(403).json({ error: "Tu acceso ha sido deshabilitado por un administrador." });
                }

                user.permisos = {
                    agua: Boolean(user.permiso_agua),
                    catastro: Boolean(user.permiso_catastro),
                    comercio: Boolean(user.permiso_comercio)
                };
                delete user.hash;

                const token = jwt.sign(
                    { id: user.id, email: user.email, rol: user.rol, permisos: user.permisos },
                    process.env.JWT_SECRET,
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
};
