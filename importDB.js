const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: 'C:\\Users\\usuario\\OneDrive\\Escritorio\\BackTraqveris\\.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: {
      require: true,
      rejectUnauthorized: false
  }
});

async function importSchema() {
  try {
    console.log('⏳ Conectando a Neon para inyectar esquema...');
    const client = await pool.connect();
    
    console.log('⏳ Ejecutando Query SQL...');
    const result = await client.query('SELECT * FROM usuarios;');
    console.log('Usuarios en la DB:', result.rows);
    
    console.log('✅ LECTURA EXITOSA!');
    client.release();
  } catch (err) {
    console.error('❌ ERROR CRÍTICO:', err.stack);
  } finally {
    pool.end();
  }
}

importSchema();
