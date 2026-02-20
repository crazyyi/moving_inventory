// scripts/db-health-check.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not provided to the process environment.');
  process.exit(1);
}

async function checkDatabaseConnection() {
  const pool = new Pool({ connectionString });

  try {
    const db = drizzle(pool);

    // Simple query to verify connectivity
    const result = await db.execute(
      sql`SELECT 1 AS connected, NOW() AS server_time`,
    );

    console.log('✅ Database connection successful!');

    // Result handling (Drizzle returns an array for node-postgres)
    const row = result.rows[0];
    console.log('Server time:', row.server_time);

    console.log('Connected:', row.connected === 1 ? 'Yes' : 'No');
  } catch (error: unknown) {
    console.error('❌ Database connection failed');
    console.error(
      'Error:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void checkDatabaseConnection();