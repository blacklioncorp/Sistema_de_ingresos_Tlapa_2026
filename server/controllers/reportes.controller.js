import { db } from '../config/db.js';

export const getReportes = async (req, res) => {
    const { desde, hasta } = req.query;

    const ahora = new Date();
    const primerDiaMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`;
    const fechaDesde = desde || primerDiaMes;
    const fechaHasta = hasta || ahora.toISOString().split('T')[0];

    try {
        const [totalPeriodo] = await db.query(
            "SELECT COALESCE(SUM(monto_total), 0) as total, COUNT(*) as num_pagos FROM pagos WHERE DATE(fecha_pago) BETWEEN ? AND ?",
            [fechaDesde, fechaHasta]
        );

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

        const [diaria] = await db.query(
            `SELECT DATE(fecha_pago) as dia, COALESCE(SUM(monto_total), 0) as total, COUNT(*) as num_pagos
             FROM pagos
             WHERE DATE(fecha_pago) BETWEEN ? AND ?
             GROUP BY DATE(fecha_pago)
             ORDER BY dia ASC`,
            [fechaDesde, fechaHasta]
        );

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
};
