import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';
import { INITIAL_DATABASE } from '../src/lib/disasterDb.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const root = process.cwd();
const migrationFile = path.join(root, 'database', 'migrations', '001-initial.sql');

const legacyDocuments = [
  {
    key: 'accounts',
    file: process.env.AUTH_STORE_FILE || path.join(root, 'data', 'accounts.json'),
    initial: { users: [], sessions: [], passwordResets: [] }
  },
  {
    key: 'family_groups',
    file: process.env.FAMILY_GROUPS_FILE || path.join(root, 'data', 'family_groups.json'),
    initial: { groups: [] }
  },
  {
    key: 'disaster_database',
    file: process.env.DISASTER_DB_FILE || path.join(root, 'data', 'disaster_database.json'),
    initial: INITIAL_DATABASE
  }
];

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL harus diisi sebelum menjalankan migrasi.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(await fs.readFile(migrationFile, 'utf8'));
    await client.query(
      'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
      ['001-initial']
    );

    for (const document of legacyDocuments) {
      let value = document.initial;
      try {
        value = JSON.parse(await fs.readFile(document.file, 'utf8'));
      } catch (error) {
        if (error.code !== 'ENOENT' || value === undefined) throw error;
      }
      await client.query(
        'INSERT INTO app_documents (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
        [document.key, JSON.stringify(value)]
      );
    }

    await client.query('COMMIT');
    console.log('Migrasi PostgreSQL selesai. Dokumen yang sudah ada tidak ditimpa.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

try {
  await migrate();
} catch (error) {
  console.error('Migrasi PostgreSQL gagal:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
