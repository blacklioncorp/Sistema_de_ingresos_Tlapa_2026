import { db } from '../config/db.js';

export const getEstadisticas = async (req, res) => {
    try {
        const [recaudHoy] = await db.query("SELECT COALESCE(SUM(monto_total), 0) as total FROM pagos WHERE fecha_pago::date = CURRENT_DATE");
        const [recaudMes] = await db.query("SELECT COALESCE(SUM(monto_total), 0) as total FROM pagos WHERE EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM CURRENT_DATE)");
        const [recaudMesAnterior] = await db.query("SELECT COALESCE(SUM(monto_total), 0) as total FROM pagos WHERE EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM (CURRENT_DATE - INTERVAL '1 month')) AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM (CURRENT_DATE - INTERVAL '1 month'))");
        const [totalContribuyentes] = await db.query("SELECT COUNT(*) as total FROM contribuyentes");
        const [nuevosHoy] = await db.query("SELECT COUNT(*) as total FROM contribuyentes WHERE creado_en::date = CURRENT_DATE");
        const [pagosHoy] = await db.query("SELECT COUNT(*) as total FROM pagos WHERE fecha_pago::date = CURRENT_DATE");
        const [pagosMes] = await db.query("SELECT COUNT(*) as total FROM pagos WHERE EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM CURRENT_DATE)");
        
        const [recaudPorArea] = await db.query(`
             SELECT cc.area, COALESCE(SUM(pd.monto), 0) as total
             FROM pago_detalles pd
             JOIN conceptos_cobro cc ON pd.concepto_id = cc.id
             JOIN pagos p ON pd.pago_id = p.id
             WHERE p.fecha_pago::date = CURRENT_DATE
             GROUP BY cc.area
        `);

        const mesActual = parseFloat(recaudMes[0].total);
        const mesAnterior = parseFloat(recaudMesAnterior[0].total);
        let variacion = 0;
        if (mesAnterior > 0) {
            variacion = ((mesActual - mesAnterior) / mesAnterior) * 100;
        } else if (mesActual > 0) {
            variacion = 100;
        }

        const [recaudSemanal] = await db.query(`
             SELECT fecha_pago::date as dia, COALESCE(SUM(monto_total), 0) as total
             FROM pagos
             WHERE fecha_pago >= (CURRENT_DATE - INTERVAL '6 days')
             GROUP BY fecha_pago::date
             ORDER BY dia ASC
        `);

        const diasSemana = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = recaudSemanal.find(r => {
                const rDate = new Date(r.dia).toISOString().split('T')[0];
                return rDate === dateStr;
            });
            diasSemana.push({
                dia: dateStr,
                dia_nombre: d.toLocaleDateString('es-MX', { weekday: 'short' }),
                total: found ? parseFloat(found.total) : 0
            });
        }

        res.json({
            success: true,
            recaudacion_hoy: parseFloat(recaudHoy[0].total),
            recaudacion_mes: mesActual,
            variacion_mensual: parseFloat(variacion.toFixed(1)),
            total_contribuyentes: totalContribuyentes[0].total,
            nuevos_contribuyentes_hoy: nuevosHoy[0].total,
            pagos_hoy: pagosHoy[0].total,
            pagos_mes: pagosMes[0].total,
            recaudacion_por_area: recaudPorArea,
            recaudacion_semanal: diasSemana
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getActividadReciente = async (req, res) => {
    try {
        const [actividad] = await db.query(`
             SELECT p.id, p.monto_total, p.fecha_pago, p.notas,
                    u.nombre as cajero_nombre,
                    c.nombre_completo as contribuyente_nombre, c.rfc
             FROM pagos p
             JOIN usuarios u ON p.cajero_id = u.id
             LEFT JOIN contribuyentes c ON p.contribuyente_id = c.id
             ORDER BY p.fecha_pago DESC
             LIMIT 10
        `);
        res.json({ success: true, actividad });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
