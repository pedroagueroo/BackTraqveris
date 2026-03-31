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

async function importFullDB() {
  const client = await pool.connect();
  try {
    console.log('⏳ Conectando a Neon para inyectar ESQUEMA + DATOS...');
    
    // 1. Limpiamos la base de datos Neon
    console.log('⏳ Reiniciando el motor Neon a estado 0 absoluto...');
    await client.query(`
        DROP SCHEMA IF EXISTS public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO public;
    `);
    
    // Forzamos la busqueda en public
    await client.query('SET search_path TO public');

    const sqlPath = "C:\\Users\\usuario\\OneDrive\\Escritorio\\backup_agencia_full.sql";
    console.log(`⏳ Leyendo archivo SQL completo: ${sqlPath}`);
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    // 2. Filtramos el SQL para Evitar los Conflictos Típicos de Neon
    // Buscamos donde empieza el CREATE para ignorar todos los DROP iniciales de pg_dump
    const indexCreate = sqlScript.indexOf('CREATE ');
    let useScript = sqlScript;
    if (indexCreate !== -1) {
        useScript = sqlScript.substring(indexCreate);
    }

    const cleanSql = useScript
        .split('\n')
        .filter(line => !line.trim().startsWith('\\')) // Quita comandos PSQL
        .filter(line => !line.includes('OWNER TO postgres')) // Usa neondb_owner
        .join('\n');

    console.log('⏳ Ejecutando Megabloque SQL...');
    await client.query(cleanSql);
    
    console.log('✅ BASE DE DATOS MIGRADA CON ÉXITO A NEON!');
    
  } catch (err) {
    console.log('======= ERROR CRÍTICO =======');
    console.log(err.message);
    console.log('=============================');
  } finally {
    client.release();
    pool.end();
  }
}

importFullDB();
