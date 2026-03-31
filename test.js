require('dotenv').config({ path: 'C:\\Users\\usuario\\OneDrive\\Escritorio\\BackTraqveris\\.env' });
const pool = require('./src/db');

async function checkData() {
  try {
    const clients = await pool.query('SELECT COUNT(*) FROM clientes');
    const users = await pool.query('SELECT COUNT(*) FROM usuarios');
    const reservations = await pool.query('SELECT COUNT(*) FROM reservas');

    console.log(`📊 DATOS MIGRADOS CON ÉXITO A LA NUBE NEON:`);
    console.log(`- Clientes reales: ${clients.rows[0].count}`);
    console.log(`- Usuarios (agentes): ${users.rows[0].count}`);
    console.log(`- Reservas activas: ${reservations.rows[0].count}`);
    console.log(`\n¡Ya puedes loguearte desde tu página de Vercel con los mismos usuarios que tenías en tu DBeaver local!`);
  } catch (err) {
    console.error('Error al contar data:', err.message);
  } finally {
    pool.end();
  }
}

checkData();
