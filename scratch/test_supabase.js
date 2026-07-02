import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function run() {
    console.log("Supabase URL:", SUPABASE_URL);
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error("Missing Supabase credentials in .env");
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        console.log("Consultando contribuyentes en Supabase...");
        const { data, error } = await supabase
            .from('contribuyentes')
            .select('*');

        if (error) {
            console.error("Error al consultar:", error.message);
        } else {
            console.log("Registros en Supabase:", data);
        }
        process.exit(0);
    } catch (e) {
        console.error("Exception:", e);
        process.exit(1);
    }
}

run();
