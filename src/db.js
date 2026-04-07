const { Pool } = require('pg');
require('dotenv').config();

// db.js - Conexión multi-entorno
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
} : {
  user: process.env.DB_USER,
  host: process.env.DB_HOST || '127.0.0.1', 
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: (process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech')) || isProduction ? { rejectUnauthorized: false } : false 
});

// Forzar search_path para NeonDB (que por defecto lo tira a un path inalcanzable)
pool.on('connect', client => {
  client.query('SET search_path TO public');
});

// Prueba de conexión inmediata al arrancar
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ ERROR CRÍTICO DE CONEXIÓN A LA DB:', err.stack);
  }
  console.log('✅ CONEXIÓN EXITOSA A POSTGRESQL LOCAL (agencia_db)');
  release();
});

module.exports = pool;