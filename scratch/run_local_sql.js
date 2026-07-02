import { db } from '../server/config/db.js';

const sqlScript = `
DO $$
DECLARE
    v_cajero_id INTEGER;

    -- IDs de contribuyentes
    c1 INTEGER; c2 INTEGER; c3 INTEGER; c4 INTEGER; c5 INTEGER;
    c6 INTEGER; c7 INTEGER; c8 INTEGER; c9 INTEGER; c10 INTEGER;

    -- IDs de activos
    a_toma INTEGER;
    a_predio INTEGER;
    a_licencia INTEGER;

    -- ID de pago (reutilizable, uno por transacción)
    v_pago_id INTEGER;
BEGIN
    -- --------------------------------------------------------------------
    -- 0. Verificar que exista al menos un usuario/cajero para asociar pagos
    -- --------------------------------------------------------------------
    SELECT id INTO v_cajero_id FROM usuarios ORDER BY id LIMIT 1;
    IF v_cajero_id IS NULL THEN
        RAISE EXCEPTION 'No hay ningún usuario en la tabla "usuarios". Crea al menos un cajero/admin antes de correr este script.';
    END IF;

    -- ========================================================================
    -- 1. CONTRIBUYENTES (10 registros, ubicados en distintos barrios de Tlapa)
    -- ========================================================================
    INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud, sync_status, creado_en)
    VALUES ('CARM800115MG1', 'María Elena Castillo Rojas', 'Calle Miguel Hidalgo 45, Centro', '7571050112', 'maria.castillo.demo@example.com', 17.54530, -98.57350, 'synced', now() - interval '180 days')
    RETURNING id INTO c1;

    INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud, sync_status, creado_en)
    VALUES ('SANR750620HD2', 'Roberto Carlos Sánchez Nava', 'Calle Morelos 12, San Diego', '7571050212', 'roberto.sanchez.demo@example.com', 17.54780, -98.56880, 'synced', now() - interval '175 days')
    RETURNING id INTO c2;

    INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud, sync_status, creado_en)
    VALUES ('TOMG820310MJ3', 'Guadalupe Torres Medina', 'Av. Las Palmas 8, Las Palmas', '7571050312', 'guadalupe.torres.demo@example.com', 17.54980, -98.57450, 'synced', now() - interval '170 days')
    RETURNING id INTO c3;

    INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud, sync_status, creado_en)
    VALUES ('FOBJ690925HG4', 'Jesús Antonio Flores Bautista', 'Calle Providencia 21, Providencia', '7571050412', 'jesus.flores.demo@example.com', 17.54550, -98.58250, 'synced', now() - interval '400 days')
    RETURNING id INTO c4;

    INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud, sync_status, creado_en)
    VALUES ('MOVA880504MF5', 'Ana Patricia Morales Vega', 'Calle Ahuatepec 33, Ahuatepec Ejido', '7571050512', 'ana.morales.demo@example.com', 17.53950, -98.58250, 'synced', now() - interval '390 days')
    RETURNING id INTO c5;

    INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud, sync_status, creado_en)
    VALUES ('RACF730812HJ6', 'Fernando Javier Ramírez Cruz', 'Calle Lázaro Cárdenas 7, Lázaro Cárdenas', '7571050612', 'fernando.ramirez.demo@example.com', 17.53300, -98.57400, 'synced', now() - interval '380 days')
    RETURNING id INTO c6;

    INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud, sync_status, creado_en)
    VALUES ('GOOS910218MB7', 'Silvia Beatriz Gómez Ortiz', 'Calle Constitución 15, Colonia Constitución', '7571050712', 'silvia.gomez.demo@example.com', 17.53000, -98.58000, 'synced', now() - interval '160 days')
    RETURNING id INTO c7;

    INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud, sync_status, creado_en)
    VALUES ('HELM840730HL8', 'Miguel Ángel Hernández Luna', 'Calle Caltitlán 19, Caltitlán', '7571050812', 'miguel.hernandez.demo@example.com', 17.54000, -98.57600, 'synced', now() - interval '150 days')
    RETURNING id INTO c8;

    INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud, sync_status, creado_en)
    VALUES ('MADR670922MQ9', 'Rosa Isela Martínez Domínguez', 'Calle Mirasol 5, Mirasol', '7571050912', 'rosa.martinez.demo@example.com', 17.54100, -98.56800, 'synced', now() - interval '500 days')
    RETURNING id INTO c9;

    INSERT INTO contribuyentes (rfc, nombre_completo, direccion, telefono, email, latitud, longitud, sync_status, creado_en)
    VALUES ('PISC860415HP0', 'Carlos Eduardo Pineda Salgado', 'Calle Tepeyac 27, Tepeyac', '7571051012', 'carlos.pineda.demo@example.com', 17.54400, -98.56200, 'synced', now() - interval '140 days')
    RETURNING id INTO c10;

    -- ========================================================================
    -- 2. CONTRIBUYENTE 1 — Agua — MOROSO (sin pagos registrados nunca)
    -- ========================================================================
    INSERT INTO tomas_agua (numero_contrato, direccion_toma, tipo_servicio, estado, latitud, longitud, contribuyente_id)
    VALUES ('AGU-2026-0101', 'Calle Miguel Hidalgo 45, Centro', 'domestico', 'activo', 17.54530, -98.57350, c1);
    -- Sin INSERT en pago_detalles -> vencimiento = null -> moroso automáticamente

    -- ========================================================================
    -- 3. CONTRIBUYENTE 2 — Agua — PRÓXIMO (vencimiento 2026-07-04)
    -- ========================================================================
    INSERT INTO tomas_agua (numero_contrato, direccion_toma, tipo_servicio, estado, latitud, longitud, contribuyente_id)
    VALUES ('AGU-2026-0102', 'Calle Morelos 12, San Diego', 'domestico', 'activo', 17.54780, -98.56880, c2)
    RETURNING id INTO a_toma;

    INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, fecha_pago, notas)
    VALUES (v_cajero_id, c2, 150.00, '2026-06-04 10:15:00', 'Pago demo - mensualidad agua')
    RETURNING id INTO v_pago_id;

    INSERT INTO pago_detalles (pago_id, concepto_id, monto, activo_ref, periodo_inicio, periodo_fin, anio_fiscal, mes_fiscal)
    VALUES (v_pago_id, 1, 150.00, 'AGU-2026-0102', '2026-06-04', '2026-07-04', 2026, 6);

    -- ========================================================================
    -- 4. CONTRIBUYENTE 3 — Agua — CUMPLIDOR (vencimiento 2026-08-01)
    -- ========================================================================
    INSERT INTO tomas_agua (numero_contrato, direccion_toma, tipo_servicio, estado, latitud, longitud, contribuyente_id)
    VALUES ('AGU-2026-0103', 'Av. Las Palmas 8, Las Palmas', 'domestico', 'activo', 17.54980, -98.57450, c3)
    RETURNING id INTO a_toma;

    INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, fecha_pago, notas)
    VALUES (v_cajero_id, c3, 150.00, '2026-07-01 09:30:00', 'Pago demo - mensualidad agua')
    RETURNING id INTO v_pago_id;

    INSERT INTO pago_detalles (pago_id, concepto_id, monto, activo_ref, periodo_inicio, periodo_fin, anio_fiscal, mes_fiscal)
    VALUES (v_pago_id, 1, 150.00, 'AGU-2026-0103', '2026-07-01', '2026-08-01', 2026, 7);

    -- ========================================================================
    -- 5. CONTRIBUYENTE 4 — Catastro — MOROSO (vencido desde 2024)
    -- ========================================================================
    INSERT INTO predios_catastro (clave_catastral, direccion_predio, valor_catastral, tipo_predio, latitud, longitud, contribuyente_id)
    VALUES ('PRED-2026-0104', 'Calle Providencia 21, Providencia', 380000.00, 'urbano', 17.54550, -98.58250, c4)
    RETURNING id INTO a_predio;

    INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, fecha_pago, notas)
    VALUES (v_cajero_id, c4, 1200.00, '2024-01-15 11:00:00', 'Pago demo - predial anual 2024')
    RETURNING id INTO v_pago_id;

    INSERT INTO pago_detalles (pago_id, concepto_id, monto, activo_ref, periodo_inicio, periodo_fin, anio_fiscal, mes_fiscal)
    VALUES (v_pago_id, 5, 1200.00, 'PRED-2026-0104', '2024-01-01', '2024-12-31', 2024, 12);

    -- ========================================================================
    -- 6. CONTRIBUYENTE 5 — Catastro — PRÓXIMO (vencimiento 2026-07-05)
    -- ========================================================================
    INSERT INTO predios_catastro (clave_catastral, direccion_predio, valor_catastral, tipo_predio, latitud, longitud, contribuyente_id)
    VALUES ('PRED-2026-0105', 'Calle Ahuatepec 33, Ahuatepec Ejido', 295000.00, 'urbano', 17.53950, -98.58250, c5)
    RETURNING id INTO a_predio;

    INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, fecha_pago, notas)
    VALUES (v_cajero_id, c5, 1200.00, '2025-07-05 12:20:00', 'Pago demo - predial anual')
    RETURNING id INTO v_pago_id;

    INSERT INTO pago_detalles (pago_id, concepto_id, monto, activo_ref, periodo_inicio, periodo_fin, anio_fiscal, mes_fiscal)
    VALUES (v_pago_id, 5, 1200.00, 'PRED-2026-0105', '2025-07-05', '2026-07-05', 2025, 7);

    -- ========================================================================
    -- 7. CONTRIBUYENTE 6 — Catastro — CUMPLIDOR (vencimiento 2026-12-31)
    -- ========================================================================
    INSERT INTO predios_catastro (clave_catastral, direccion_predio, valor_catastral, tipo_predio, latitud, longitud, contribuyente_id)
    VALUES ('PRED-2026-0106', 'Calle Lázaro Cárdenas 7, Lázaro Cárdenas', 410000.00, 'urbano', 17.53300, -98.57400, c6)
    RETURNING id INTO a_predio;

    INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, fecha_pago, notas)
    VALUES (v_cajero_id, c6, 1200.00, '2026-01-10 09:00:00', 'Pago demo - predial anual 2026')
    RETURNING id INTO v_pago_id;

    INSERT INTO pago_detalles (pago_id, concepto_id, monto, activo_ref, periodo_inicio, periodo_fin, anio_fiscal, mes_fiscal)
    VALUES (v_pago_id, 5, 1200.00, 'PRED-2026-0106', '2026-01-01', '2026-12-31', 2026, 12);

    -- ========================================================================
    -- 8. CONTRIBUYENTE 7 — Comercio — MOROSO (sin pagos registrados nunca)
    -- ========================================================================
    INSERT INTO licencias_comercio (numero_licencia, nombre_negocio, giro, direccion_local, estado, latitud, longitud, contribuyente_id)
    VALUES ('LIC-2026-0107', 'Abarrotes Gómez', 'Comercio al por menor - abarrotes', 'Calle Constitución 15, Colonia Constitución', 'activo', 17.53000, -98.58000, c7);
    -- Sin pago_detalles -> moroso automáticamente

    -- ========================================================================
    -- 9. CONTRIBUYENTE 8 — Comercio — PRÓXIMO (vencimiento 2026-07-05)
    -- ========================================================================
    INSERT INTO licencias_comercio (numero_licencia, nombre_negocio, giro, direccion_local, estado, latitud, longitud, contribuyente_id)
    VALUES ('LIC-2026-0108', 'Ferretería Hernández', 'Comercio al por menor - ferretería', 'Calle Caltitlán 19, Caltitlán', 'activo', 17.54000, -98.57600, c8)
    RETURNING id INTO a_licencia;

    INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, fecha_pago, notas)
    VALUES (v_cajero_id, c8, 850.00, '2025-07-05 14:45:00', 'Pago demo - refrendo licencia anual')
    RETURNING id INTO v_pago_id;

    INSERT INTO pago_detalles (pago_id, concepto_id, monto, activo_ref, periodo_inicio, periodo_fin, anio_fiscal, mes_fiscal)
    VALUES (v_pago_id, 7, 850.00, 'LIC-2026-0108', '2025-07-05', '2026-07-05', 2025, 7);

    -- ========================================================================
    -- 10. CONTRIBUYENTE 9 — Agua (cumplidor) + Catastro (moroso) + Comercio (próximo)
    -- ========================================================================
    INSERT INTO tomas_agua (numero_contrato, direccion_toma, tipo_servicio, estado, latitud, longitud, contribuyente_id)
    VALUES ('AGU-2026-0109', 'Calle Mirasol 5, Mirasol', 'domestico', 'activo', 17.54100, -98.56800, c9)
    RETURNING id INTO a_toma;

    INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, fecha_pago, notas)
    VALUES (v_cajero_id, c9, 150.00, '2026-07-15 10:00:00', 'Pago demo - mensualidad agua adelantada')
    RETURNING id INTO v_pago_id;

    INSERT INTO pago_detalles (pago_id, concepto_id, monto, activo_ref, periodo_inicio, periodo_fin, anio_fiscal, mes_fiscal)
    VALUES (v_pago_id, 1, 150.00, 'AGU-2026-0109', '2026-07-15', '2026-08-15', 2026, 7);

    INSERT INTO predios_catastro (clave_catastral, direccion_predio, valor_catastral, tipo_predio, latitud, longitud, contribuyente_id)
    VALUES ('PRED-2026-0109', 'Calle Mirasol 5, Mirasol', 520000.00, 'urbano', 17.54100, -98.56800, c9);
    -- Sin pago_detalles -> catastro moroso

    INSERT INTO licencias_comercio (numero_licencia, nombre_negocio, giro, direccion_local, estado, latitud, longitud, contribuyente_id)
    VALUES ('LIC-2026-0109', 'Farmacia Martínez', 'Comercio al por menor - farmacia', 'Calle Mirasol 5, Mirasol', 'activo', 17.54100, -98.56800, c9)
    RETURNING id INTO a_licencia;

    INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, fecha_pago, notas)
    VALUES (v_cajero_id, c9, 850.00, '2025-07-06 16:10:00', 'Pago demo - refrendo licencia anual')
    RETURNING id INTO v_pago_id;

    INSERT INTO pago_detalles (pago_id, concepto_id, monto, activo_ref, periodo_inicio, periodo_fin, anio_fiscal, mes_fiscal)
    VALUES (v_pago_id, 7, 850.00, 'LIC-2026-0109', '2025-07-06', '2026-07-06', 2025, 7);

    -- ========================================================================
    -- 11. CONTRIBUYENTE 10 — Agua (próximo) + Comercio (cumplidor)
    -- ========================================================================
    INSERT INTO tomas_agua (numero_contrato, direccion_toma, tipo_servicio, estado, latitud, longitud, contribuyente_id)
    VALUES ('AGU-2026-0110', 'Calle Tepeyac 27, Tepeyac', 'domestico', 'activo', 17.54400, -98.56200, c10)
    RETURNING id INTO a_toma;

    INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, fecha_pago, notas)
    VALUES (v_cajero_id, c10, 150.00, '2026-06-03 08:50:00', 'Pago demo - mensualidad agua')
    RETURNING id INTO v_pago_id;

    INSERT INTO pago_detalles (pago_id, concepto_id, monto, activo_ref, periodo_inicio, periodo_fin, anio_fiscal, mes_fiscal)
    VALUES (v_pago_id, 1, 150.00, 'AGU-2026-0110', '2026-06-03', '2026-07-03', 2026, 6);

    INSERT INTO licencias_comercio (numero_licencia, nombre_negocio, giro, direccion_local, estado, latitud, longitud, contribuyente_id)
    VALUES ('LIC-2026-0110', 'Papelería Pineda', 'Comercio al por menor - papelería', 'Calle Tepeyac 27, Tepeyac', 'activo', 17.54400, -98.56200, c10)
    RETURNING id INTO a_licencia;

    INSERT INTO pagos (cajero_id, contribuyente_id, monto_total, fecha_pago, notas)
    VALUES (v_cajero_id, c10, 850.00, '2026-01-20 13:25:00', 'Pago demo - refrendo licencia anual')
    RETURNING id INTO v_pago_id;

    INSERT INTO pago_detalles (pago_id, concepto_id, monto, activo_ref, periodo_inicio, periodo_fin, anio_fiscal, mes_fiscal)
    VALUES (v_pago_id, 7, 850.00, 'LIC-2026-0110', '2026-01-01', '2026-12-31', 2026, 12);
END $$;
`;

async function run() {
    try {
        console.log("Ejecutando script de inserción demo en la base de datos local PostgreSQL...");
        await db.query(sqlScript);
        console.log("✅ Datos demo locales insertados con éxito.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Error al insertar datos demo locales:", e.message);
        process.exit(1);
    }
}

run();
