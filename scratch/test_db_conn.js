import { db } from '../server/config/db.js';

async function run() {
    try {
        console.log("Conectando a base de datos PostgreSQL...");
        const [rows] = await db.query("SELECT CURRENT_DATABASE(), VERSION();");
        console.log("Conexión exitosa:", rows[0]);

        console.log("Creando tabla referencias_pago...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS referencias_pago (
                id SERIAL PRIMARY KEY,
                cloud_id UUID DEFAULT gen_random_uuid() UNIQUE,
                sync_status VARCHAR(20) DEFAULT 'pending',
                folio VARCHAR(50) UNIQUE NOT NULL,
                contribuyente_id INTEGER NOT NULL REFERENCES contribuyentes(id) ON DELETE CASCADE,
                monto_total NUMERIC(12, 2) NOT NULL,
                estado VARCHAR(20) CHECK (estado IN ('pendiente', 'pagado', 'cancelado')) DEFAULT 'pendiente',
                detalles JSONB NOT NULL,
                creado_en TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Tabla referencias_pago creada o ya existente.");

        console.log("Creando índice para folio...");
        await db.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_referencias_pago_folio ON referencias_pago (folio);
        `);
        console.log("Índice creado.");

        console.log("Migración completa con éxito.");
        process.exit(0);
    } catch (err) {
        console.error("Error durante la migración:", err);
        process.exit(1);
    }
}

run();
