import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export const DRIZZLE = 'DRIZZLE';

export const drizzleProvider = [
  {
    provide: DRIZZLE,
    useFactory: (): NodePgDatabase<typeof schema> => {
      const connectionString = process.env.DATABASE_URL;

      if (!connectionString) {
        throw new Error('DATABASE_URL is not defined in environment variables');
      }

      console.log('📡 Attempting to connect to Database...');
      const pool = new Pool({
        connectionString,
        max: 20, // Max connections in pool
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 3000,
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
        // Add logging, allowExitOnIdle, etc. as needed
      });

      console.log('✅ Pool instance created');

      pool.on('error', (err) => {
        console.error('❌ Unexpected error on idle client', err);
        process.exit(-1);
      });

      return drizzle(pool, { schema });
    },
  },
];
