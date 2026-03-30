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
    
    const sqlPath = "C:\\Users\\usuario\\OneDrive\\Escritorio\\esquema_agencia.sql";
    console.log(`⏳ Leyendo archivo SQL Version 2 de: ${sqlPath}`);
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('⏳ Limpiando BD Neon: Destruyendo tablas viejas...');
    // Comando destructivo para reiniciar el esquema a 0 absoluto
    await client.query(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO public;
    `);

    // Filtros críticos para Neon:
    // 1. Quitar comandos \restrict que fallan en pg.query()
    // 2. Quitar `OWNER TO postgres` ya que en Neon no eres 'postgres' sino 'neondb_owner'
    const cleanSql = sqlScript
        .split('\n')
        .filter(line => !line.trim().startsWith('\\')) // Elimina comandos de consola
        .filter(line => !line.includes('OWNER TO postgres')) // Elimina dueños estrictos
        .join('\n');

    console.log('⏳ Ejecutando Query SQL...');
    await client.query(cleanSql);
    
    console.log('✅ ESQUEMA IMPORTADO CON ÉXITO EN NEON!');
    client.release();
  } catch (err) {
    console.error('❌ ERROR CRÍTICO:', err.stack);
  } finally {
    pool.end();
  }
}

importSchema();
