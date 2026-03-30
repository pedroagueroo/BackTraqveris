require('dotenv').config({ path: 'C:\\Users\\usuario\\OneDrive\\Escritorio\\BackTraqveris\\.env' });
const pool = require('./src/db');

async function seedUser() {
  try {
    const userResult = await pool.query("INSERT INTO public.usuarios (nombre_usuario, password, rol, empresa_nombre) VALUES ('pedro_admin', 'pedro_123', 'ADMIN', 'Traveris Pro') ON CONFLICT (nombre_usuario) DO NOTHING RETURNING *;");
    console.log('✅ Creado usuario administrador provisorio', userResult.rows[0]);
  } catch (err) {
    console.error('Error insertando user:', err);
  } finally {
    pool.end();
  }
}

seedUser();
