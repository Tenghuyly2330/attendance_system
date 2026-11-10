const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DB_URL || process.env.DATABASE_URL;

let poolConfig = {};

if (connectionString) {
  const isNeonOrCloud = connectionString.includes('neon.tech') || 
                        connectionString.includes('supabase') || 
                        connectionString.includes('sslmode=require');
  poolConfig = {
    connectionString,
    ssl: isNeonOrCloud ? { rejectUnauthorized: false } : false
  };
} else {
  poolConfig = {
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10),
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.PGDATABASE || process.env.DB_NAME || 'attendance_db',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function initDB() {
  try {
    const client = await pool.connect();
    try {
      console.log('PostgreSQL connected. Verifying database tables...');
      const sqlPath = path.join(__dirname, '..', 'init.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log('Database schema verified & seeded successfully.');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to initialize database schema:', error.message);
  }
}

module.exports = {
  pool,
  query,
  initDB
};

