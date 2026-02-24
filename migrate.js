import mysql from 'mysql2/promise';

async function migrate() {
    const db = await mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'recaudacion_tlapa',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        await db.query(`ALTER TABLE conceptos_cobro ADD COLUMN clave VARCHAR(50);`);
        console.log("Added clave column (no unique yet).");
    } catch (e) {
        console.error("Error adding clave: ", e.message);
    }

    try {
        await db.query(`UPDATE conceptos_cobro SET clave = CONCAT(UPPER(SUBSTRING(area, 1, 3)), '-', id) WHERE clave IS NULL OR clave = '';`);
        console.log("Updated dummy keys for clave.");
    } catch (e) {
        console.error("Error updating keys: ", e.message);
    }

    try {
        await db.query(`ALTER TABLE conceptos_cobro ADD UNIQUE (clave);`);
        console.log("Added UNIQUE constraint to clave.");
    } catch (e) {
        console.error("Error adding unique index: ", e.message);
    }

    process.exit(0);
}

migrate();
