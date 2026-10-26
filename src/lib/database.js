import pg from 'pg';

const { Pool } = pg;
let pool;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL harus dikonfigurasi untuk mengakses penyimpanan PostgreSQL.');
  }

  if (!pool) {
    const configuredMax = Number.parseInt(process.env.DATABASE_POOL_MAX || '10', 10);
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number.isInteger(configuredMax) && configuredMax > 0 ? configuredMax : 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true
    });
  }
  return pool;
}

export async function readDocument(key, initialValue) {
  const client = await getPool().connect();
  try {
    await client.query(
      'INSERT INTO app_documents (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
      [key, JSON.stringify(initialValue)]
    );
    const result = await client.query('SELECT value FROM app_documents WHERE key = $1', [key]);
    if (!result.rows[0]) throw new Error(`Dokumen database "${key}" tidak ditemukan setelah inisialisasi.`);
    return result.rows[0].value;
  } finally {
    client.release();
  }
}

export async function mutateDocument(key, initialValue, mutator) {
  const client = await getPool().connect();
  let transactionStarted = false;
  try {
    await client.query('BEGIN');
    transactionStarted = true;
    await client.query(
      'INSERT INTO app_documents (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
      [key, JSON.stringify(initialValue)]
    );
    const result = await client.query('SELECT value FROM app_documents WHERE key = $1 FOR UPDATE', [key]);
    if (!result.rows[0]) throw new Error(`Dokumen database "${key}" tidak ditemukan setelah inisialisasi.`);
    const value = result.rows[0].value;
    const resultValue = await mutator(value);
    await client.query('UPDATE app_documents SET value = $2, updated_at = NOW() WHERE key = $1', [
      key,
      JSON.stringify(value)
    ]);
    await client.query('COMMIT');
    transactionStarted = false;
    return resultValue;
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function consumeRateLimit(key, limit, windowSeconds) {
  const result = await getPool().query(
    `WITH expired AS (
       DELETE FROM rate_limit_buckets
       WHERE window_started_at < NOW() - INTERVAL '1 day'
      RETURNING key
    )
     INSERT INTO rate_limit_buckets (key, window_started_at, hits)
     VALUES ($1, NOW(), 1)
     ON CONFLICT (key) DO UPDATE SET
       hits = CASE
         WHEN rate_limit_buckets.window_started_at <= NOW() - ($2::double precision * INTERVAL '1 second') THEN 1
         ELSE rate_limit_buckets.hits + 1
       END,
       window_started_at = CASE
         WHEN rate_limit_buckets.window_started_at <= NOW() - ($2::double precision * INTERVAL '1 second') THEN NOW()
         ELSE rate_limit_buckets.window_started_at
       END
     RETURNING hits, window_started_at + ($2::double precision * INTERVAL '1 second') AS reset_at`,
    [key, windowSeconds]
  );
  return {
    allowed: result.rows[0].hits <= limit,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((new Date(result.rows[0].reset_at).getTime() - Date.now()) / 1000)
    )
  };
}

export async function closeDatabasePool() {
  if (!pool) return;
  const activePool = pool;
  pool = undefined;
  await activePool.end();
}
