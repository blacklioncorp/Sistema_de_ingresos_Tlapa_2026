import mysql from 'mysql2/promise';

async function check() {
    const db = await mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'recaudacion_tlapa'
    });
    const [rows] = await db.query("DESCRIBE conceptos_cobro;");
    console.log(rows);
    process.exit(0);
}

check();
