import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';
import * as schema from '../schemas/index';

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL Pool Error:', err);
});

export const db = drizzle(pool, { schema });

// Works for both `db` and a transaction `tx`
export type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function testConnection(): Promise<void> {
  try {
    const result = await pool.query('SELECT NOW() AS now, current_database() AS db');
    console.log(`✅ PostgreSQL Connected → database: ${result.rows[0].db}`);
  } catch (error) {
    console.error('❌ PostgreSQL Connection Failed!');
    console.error('   Check DB_PASSWORD / DB_NAME in server/.env');
    console.error('   Error:', (error as Error).message);
    process.exit(1);
  }
}