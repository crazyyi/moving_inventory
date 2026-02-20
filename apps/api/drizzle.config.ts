import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Path to your schema file where you defined refundStatusEnum
  schema: './src/drizzle/schema.ts',

  // Where your SQL migration files will be generated
  out: './drizzle',

  dialect: 'postgresql',
  dbCredentials: {
    // drizzle-kit natively supports reading from .env files
    // if they are in the root directory
    url: process.env.DATABASE_URL!,
  },

  // Print all SQL statements to the console
  verbose: true,

  // Always require confirmation before dropping a table
  strict: true,
});
