const { Pool } = require('pg');
require('dotenv').config({ path: 'C:\\Users\\usuario\\OneDrive\\Escritorio\\BackTraqveris\\.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: { require: true, rejectUnauthorized: false }
});

pool.query('SELECT * FROM public.usuarios')
  .then(res => { console.log('Usuarios en DB Neon:', res.rows.length); pool.end(); })
  .catch(err => { console.error('ERROR AL CONECTAR/CONSULTAR:', err.message); pool.end(); });
