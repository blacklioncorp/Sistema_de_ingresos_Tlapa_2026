import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',      
    password: process.env.DB_PASSWORD || '',   
    database: process.env.DB_NAME || 'recaudacion_tlapa',
    port: process.env.DB_PORT || 5432,
    max: 10
});

// Middleware local para traducir dialecto MySQL a PostgreSQL transparente
async function executeQuery(client, sql, params = []) {
    let pgSql = sql;
    let index = 1;
    while (pgSql.includes('?')) {
        pgSql = pgSql.replace('?', `$${index}`);
        index++;
    }
    
    // Auto-inyectar RETURNING id para los statements INSERT que necesita supabase/postgres
    // para emular el insertId de mysql2
    if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
        pgSql += ' RETURNING id';
        const result = await client.query(pgSql, params);
        return [Object.assign(result.rows, { insertId: result.rows[0]?.id })];
    }

    // Emular affectedRows para UPDATE y DELETE
    if (pgSql.trim().toUpperCase().startsWith('UPDATE') || pgSql.trim().toUpperCase().startsWith('DELETE')) {
        const result = await client.query(pgSql, params);
        return [{ affectedRows: result.rowCount }];
    }

    // Regla global SELECT
    const result = await client.query(pgSql, params);
    return [result.rows, result.fields];
}

export const db = {
    query: (sql, params) => executeQuery(pool, sql, params),
    getConnection: async () => {
        const client = await pool.connect();
        return {
            beginTransaction: () => client.query('BEGIN'),
            commit: async () => { await client.query('COMMIT'); client.release(); },
            rollback: async () => { await client.query('ROLLBACK'); client.release(); },
            query: (sql, params) => executeQuery(client, sql, params),
            release: () => client.release()
        };
    }
};
