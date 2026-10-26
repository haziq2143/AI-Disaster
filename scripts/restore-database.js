import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;
const allowedDocumentKeys = new Set(['accounts', 'family_groups', 'disaster_database']);

function validateBackup(snapshot) {
  if (
    snapshot?.formatVersion !== 1
    || !Array.isArray(snapshot.appDocuments)
    || !Array.isArray(snapshot.rateLimitBuckets)
    || snapshot.appDocuments.some(document =>
      !allowedDocumentKeys.has(document.key) || document.value === undefined
    )
    || snapshot.rateLimitBuckets.some(bucket =>
      typeof bucket.key !== 'string' || !Number.isInteger(bucket.hits) || bucket.hits < 1
    )
  ) {
    throw new Error('Format backup tidak valid.');
  }
  return snapshot;
}

async function restoreDatabase() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL harus dikonfigurasi sebelum restore.');
  if (process.env.DATABASE_RESTORE_CONFIRM !== 'replace-all-data') {
    throw new Error('Restore akan mengganti seluruh dokumen aplikasi. Atur DATABASE_RESTORE_CONFIRM=replace-all-data setelah memeriksa target.');
  }
  const backupFile = process.env.DATABASE_RESTORE_FILE;
  if (!backupFile) throw new Error('DATABASE_RESTORE_FILE harus menunjuk ke file backup yang akan dipulihkan.');
  const snapshot = validateBackup(JSON.parse(await fs.readFile(backupFile, 'utf8')));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, allowExitOnIdle: true });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE app_documents IN ACCESS EXCLUSIVE MODE');
    await client.query('LOCK TABLE rate_limit_buckets IN ACCESS EXCLUSIVE MODE');
    await client.query('DELETE FROM app_documents');
    await client.query('DELETE FROM rate_limit_buckets');

    for (const document of snapshot.appDocuments) {
      await client.query(
        'INSERT INTO app_documents (key, value, updated_at) VALUES ($1, $2, $3)',
        [document.key, JSON.stringify(document.value), document.updated_at]
      );
    }
    for (const bucket of snapshot.rateLimitBuckets) {
      await client.query(
        'INSERT INTO rate_limit_buckets (key, window_started_at, hits) VALUES ($1, $2, $3)',
        [bucket.key, bucket.window_started_at, bucket.hits]
      );
    }
    await client.query('COMMIT');
    console.log('Database restore completed.');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Restore rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

try {
  await restoreDatabase();
} catch (error) {
  console.error('Database restore failed:', error);
  process.exitCode = 1;
}
