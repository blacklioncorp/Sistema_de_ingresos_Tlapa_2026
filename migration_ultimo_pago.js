import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'recaudacion_tlapa'
};

async function checkAndAlter() {
    const pool = mysql.createPool(dbConfig);
    try {
        console.log("Adding ultimo_pago_historico to tomas_agua...");
        await pool.query("ALTER TABLE tomas_agua ADD COLUMN ultimo_pago_historico VARCHAR(100)");
        console.log("Column added.");
    } catch (e) {
        console.log("Error adding column (maybe exists):", e.message);
    }

    try {
        console.log("Checking for UNIQUE indexes on contribuyentes.rfc...");
        const [indexes] = await pool.query("SHOW INDEX FROM contribuyentes WHERE Column_name = 'rfc' AND Non_unique = 0");
        if (indexes.length > 0) {
            console.log("Found unique index, dropping...");
            await pool.query(`ALTER TABLE contribuyentes DROP INDEX ${indexes[0].Key_name}`);
            console.log("Unique index dropped.");
        } else {
            console.log("No unique index found on RFC.");
        }
    } catch (e) {
        console.log("Error dropping index:", e.message);
    }

    await pool.end();
}

checkAndAlter();
