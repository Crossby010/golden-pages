import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
  }

  console.log('🔄 Running migration...\n');

  const pool = new Pool({ connectionString: databaseUrl });
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

  const client = await pool.connect();

  try {
    // Drop legacy column if it exists
    try {
      await client.query(
        'ALTER TABLE books DROP COLUMN IF EXISTS cover_emoji'
      );
      console.log('✅ Dropped cover_emoji column (if it existed)');
    } catch (err) {
      console.log('ℹ️  cover_emoji drop:', (err as Error).message);
    }

    await client.query(schema);
    console.log('✅ Schema applied');
  } catch (err) {
    console.error('❌ Migration failed:');
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

migrate();