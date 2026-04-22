import { db } from '../config/db.js';

export const getCobertura = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        const nextSevenDays = new Date();
        nextSevenDays.setDate(now.getDate() + 7);

        const subqueryUltimoVencimiento = (refField) => `
            (SELECT MAX(pd.periodo_fin) 
             FROM pago_detalles pd 
             WHERE pd.activo_ref = ${refField}
            ) as ultimo_vencimiento
        `;

        const [agua] = await db.query(`
            SELECT t.id, t.numero_contrato as identificador, t.tipo_servicio as extradata, 
            t.latitud, t.longitud, t.contribuyente_id, c.nombre_completo as contribuyente, 'agua' as tipo,
            ${subqueryUltimoVencimiento('t.numero_contrato')}
            FROM tomas_agua t
            JOIN contribuyentes c ON t.contribuyente_id = c.id
            WHERE t.latitud IS NOT NULL AND t.longitud IS NOT NULL
        `);

        const [catastro] = await db.query(`
            SELECT p.id, p.clave_catastral as identificador, p.tipo_predio as extradata, 
            p.latitud, p.longitud, p.contribuyente_id, c.nombre_completo as contribuyente, 'catastro' as tipo,
            ${subqueryUltimoVencimiento('p.clave_catastral')}
            FROM predios_catastro p
            JOIN contribuyentes c ON p.contribuyente_id = c.id
            WHERE p.latitud IS NOT NULL AND p.longitud IS NOT NULL
        `);

        const [comercio] = await db.query(`
            SELECT l.id, l.numero_licencia as identificador, l.giro as extradata, 
            l.latitud, l.longitud, l.contribuyente_id, c.nombre_completo as contribuyente, 'comercio' as tipo,
            ${subqueryUltimoVencimiento('l.numero_licencia')}
            FROM licencias_comercio l
            JOIN contribuyentes c ON l.contribuyente_id = c.id
            WHERE l.latitud IS NOT NULL AND l.longitud IS NOT NULL
        `);

        const calculateState = (items) => {
            return items.map(item => {
                const vencimiento = item.ultimo_vencimiento ? new Date(item.ultimo_vencimiento) : null;
                let estado_pago = 'moroso'; // Por defecto moroso si no hay pagos

                if (vencimiento) {
                    if (vencimiento < thirtyDaysAgo) {
                        estado_pago = 'moroso';
                    } else if (vencimiento < now || vencimiento < nextSevenDays) {
                        estado_pago = 'proximo';
                    } else {
                        estado_pago = 'cumplidor';
                    }
                }

                return {
                    ...item,
                    latitud: parseFloat(item.latitud),
                    longitud: parseFloat(item.longitud),
                    estado_pago
                };
            });
        };

        const [sinUbicacion] = await db.query(`
            SELECT id, nombre_completo, direccion 
            FROM contribuyentes 
            WHERE latitud IS NULL OR longitud IS NULL
            LIMIT 100
        `);

        res.json({
            success: true,
            agua: calculateState(agua),
            catastro: calculateState(catastro),
            comercio: calculateState(comercio),
            sinUbicacion
        });
    } catch (error) {
        console.error("Error en getCobertura:", error);
        res.status(500).json({ error: error.message });
    }
};
