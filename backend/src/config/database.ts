import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in .env');
}

export const sql = neon(databaseUrl);

export async function testDbConnection(): Promise<void> {
  try {
    await sql`SELECT 1 as test`;
    console.log('✅ Neon PostgreSQL connected');
  } catch (error) {
    console.error('❌ Neon PostgreSQL connection failed:', error);
    throw error;
  }
}