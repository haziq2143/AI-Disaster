import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;

function configuredBackupDirectory() {
  const directory = process.env.DATABASE_BACKUP_DIR;
  if (!directory || !path.isAbsolute(directory)) {
    throw new Error('DATABASE_BACKUP_DIR harus menunjuk ke direktori absolut yang terlindungi, di luar repository.');
  }
  const relativePath = path.relative(process.cwd(), directory);
  if (relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))) {
    throw new Error('Simpan backup di luar repository agar data pribadi tidak masuk Git.');
  }
  return directory;
}

async function backupDatabase() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL harus dikonfigurasi sebelum membuat backup.');
  const backupDirectory = configuredBackupDirectory();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, allowExitOnIdle: true });
  const client = await pool.connect();

  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const documents = await client.query(
      'SELECT key, value, updated_at FROM app_documents ORDER BY key'
    );
    const buckets = await client.query(
      'SELECT key, window_started_at, hits FROM rate_limit_buckets ORDER BY key'
    );
    await client.query('COMMIT');

    const snapshot = {
      formatVersion: 1,
      createdAt: new Date().toISOString(),
      appDocuments: documents.rows,
      rateLimitBuckets: buckets.rows
    };
    await fs.mkdir(backupDirectory, { recursive: true, mode: 0o700 });
    const filename = `ai-disaster-${new Date().toISOString().replaceAll(':', '-')}.json`;
    const destination = path.join(backupDirectory, filename);
    const temporaryFile = `${destination}.${randomUUID()}.tmp`;
    await fs.writeFile(temporaryFile, JSON.stringify(snapshot), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await fs.rename(temporaryFile, destination);
    console.log(`Database backup created: ${destination}`);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Backup rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

try {
  await backupDatabase();
} catch (error) {
  console.error('Database backup failed:', error);
  process.exitCode = 1;
}
