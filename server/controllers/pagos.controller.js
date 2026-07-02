import { db } from '../config/db.js';

export const procesarPago = async (req, res) => {
    const { cajero_id, contribuyente_id, monto_total, notas, carrito, referencia_folio } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Si viene un folio de referencia del kiosco, actualizar su estado a 'pagado'
        if (referencia_folio) {
            await connection.query(
                "UPDATE referencias_pago SET estado = 'pagado' WHERE folio = ?",
                [referencia_folio]
            );
        }

        const [pagoResult] = await connection.query(
            "INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, notas) VALUES (?, ?, ?, ?)",
            [cajero_id, contribuyente_id, monto_total, notas]
        );
        const pagoId = pagoResult.insertId;

        for (const item of carrito) {
            let periodoInicio = null, periodoFin = null, anioFiscal = null, mesFiscal = null;
            const ahora = new Date();

            if (item.frecuencia === 'mensual') {
                const mes = item.mes_fiscal || (ahora.getMonth() + 1);
                const anio = item.anio_fiscal || ahora.getFullYear();
                anioFiscal = anio;
                mesFiscal = mes;
                periodoInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
                const ultimoDia = new Date(anio, mes, 0).getDate();
                periodoFin = `${anio}-${String(mes).padStart(2, '0')}-${ultimoDia}`;
            } else if (item.frecuencia === 'anual') {
                const anio = item.anio_fiscal || ahora.getFullYear();
                anioFiscal = anio;
                mesFiscal = null;
                periodoInicio = `${anio}-01-01`;
                periodoFin = `${anio}-12-31`;
            }

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
};
