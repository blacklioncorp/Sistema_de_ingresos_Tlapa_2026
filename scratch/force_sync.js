import { createClient } from '@supabase/supabase-js';
import { db } from '../server/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const SYNC_TABLES = [
    'usuarios',
    'contribuyentes',
    'predios_catastro',
    'tomas_agua',
    'licencias_comercio',
    'conceptos_cobro',
    'pagos',
    'pago_detalles',
    'historial_movimientos'
];

async function run() {
    console.log("Supabase URL:", SUPABASE_URL);
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error("Missing Supabase credentials");
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        console.log("Marcando todos los registros locales como 'pending'...");
        for (const table of SYNC_TABLES) {
            const [result] = await db.query(`UPDATE ${table} SET sync_status = 'pending'`);
            console.log(`- Tabla ${table}: ${result.affectedRows || 0} registros marcados.`);
        }

        console.log("\nIniciando sincronización manual...");
        for (const table of SYNC_TABLES) {
            const [pending] = await db.query(`SELECT * FROM ${table} WHERE sync_status = 'pending' LIMIT 50`);
            if (pending.length > 0) {
                console.log(`\nSincronizando ${pending.length} registros en ${table}:`);
                for (const record of pending) {
                    const recordToSync = { ...record };
                    recordToSync.sync_status = 'synced';

                    const { error } = await supabase
                        .from(table)
                        .upsert(recordToSync, { onConflict: 'id' });

                    if (error) {
                        console.error(`❌ Fallo en ${table} [ID ${record.id}]:`, error.message);
                    } else {
                        await db.query(`UPDATE ${table} SET sync_status = 'synced' WHERE id = ?`, [record.id]);
                        console.log(`✅ Éxito en ${table} [ID ${record.id}]`);
                    }
                }
            }
        }
        console.log("\nProceso de sincronización manual finalizado.");
        process.exit(0);
    } catch (e) {
        console.error("Exception:", e);
        process.exit(1);
    }
}

run();
