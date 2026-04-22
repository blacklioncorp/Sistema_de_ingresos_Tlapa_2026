import { createClient } from '@supabase/supabase-js';
import { db } from './config/db.js';
import { CronJob } from 'cron';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase;
if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL !== 'coloca_tu_url_aqui') {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Dominios que auditará el worker
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

async function syncPendingRecords() {
    if (!supabase) {
        console.warn('⚠️ Supabase URL/Key no configurado. Sincronización omitida.');
        return;
    }
    
    console.log(`[Sync Worker] Verificando registros pendientes... (${new Date().toLocaleTimeString()})`);
    
    for (const table of SYNC_TABLES) {
        try {
            // Obtener registros pendientes de sincronizar
            const [pending] = await db.query(`SELECT * FROM ${table} WHERE sync_status = 'pending' LIMIT 50`);
            
            if (pending.length > 0) {
                console.log(`[Sync Worker] Encontrados ${pending.length} registros en ${table}`);
                
                // Procesar cada registro
                for (const record of pending) {
                    const recordToSync = { ...record };
                    recordToSync.sync_status = 'synced'; // informar a la nube que ya está ok
                    
                    const { error } = await supabase
                        .from(table)
                        .upsert(recordToSync, { onConflict: 'id' });
                        
                    if (error) {
                        console.error(`❌ Fallo al sincronizar ${table} [${record.cloud_id}]:`, error.message);
                    } else {
                        // Marcar como 'synced' localmente
                        await db.query(`UPDATE ${table} SET sync_status = 'synced' WHERE cloud_id = ?`, [record.cloud_id]);
                        console.log(`✅ Sincronizado ${table} [${record.cloud_id}]`);
                    }
                }
            }
        } catch (e) {
            console.error(`[Sync Worker] Error en tabla ${table}:`, e.message);
        }
    }
}

// Iniciar cron-job (Ej. cada 2 minutos)
export const startSyncWorker = () => {
    console.log('🚀 Iniciando Sync Worker...');
    const job = new CronJob('0 */2 * * * *', syncPendingRecords);
    job.start();
    
    // Iniciar una sincronización inicial
    syncPendingRecords();
};
