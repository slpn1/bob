import { Pool } from 'pg';

// Database connection pool
let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    // Determine if we should use SSL based on the DATABASE_URL or environment
    const databaseUrl = process.env.DATABASE_URL;
    const shouldUseSSL = databaseUrl?.includes('amazonaws.com') || 
                         databaseUrl?.includes('heroku') || 
                         process.env.NODE_ENV === 'production';
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,
      max: 10, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 5000, // Timeout after 5 seconds when connecting
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client:', err);
    });
  }

  return pool;
}

export async function testDbConnection(): Promise<boolean> {
  try {
    const pool = getDbPool();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
} 