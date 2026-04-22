import { db } from './server/config/db.js';

async function test() {
    try {
        const subqueryUltimoVencimiento = (refField) => `
            (SELECT MAX(pd.periodo_fin) 
             FROM pago_detalles pd 
             WHERE pd.activo_ref = ${refField}
            ) as ultimo_vencimiento
        `;

        const sql = `
            SELECT t.id, t.numero_contrato as identificador, t.tipo_servicio as extradata, 
            t.latitud, t.longitud, c.nombre_completo as contribuyente, 'agua' as tipo,
            ${subqueryUltimoVencimiento('t.numero_contrato')}
            FROM tomas_agua t
            JOIN contribuyentes c ON t.contribuyente_id = c.id
            WHERE t.latitud IS NOT NULL AND t.longitud IS NOT NULL
        `;

        console.log("SQL:", sql);
        const [agua] = await db.query(sql);
        console.log("Result:", agua);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
