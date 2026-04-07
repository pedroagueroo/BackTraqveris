const express = require('express');
const router = express.Router();
const pool = require('./db');

// OBTENER TODOS LOS PROVEEDORES POR EMPRESA
router.get('/:empresa_nombre', async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS proveedores (
                id SERIAL PRIMARY KEY,
                empresa_nombre VARCHAR(100) NOT NULL
            )
        `);
        await pool.query('ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS nombre_comercial VARCHAR(100)');
        await pool.query('ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS razon_social_cuit VARCHAR(100)');
        await pool.query('ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS contacto VARCHAR(100)');
        await pool.query('ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS email VARCHAR(100)');
        await pool.query('ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        
        // Relajar dependencias de columnas viejas (por si el usuario ya tenía esta tabla)
        await pool.query('ALTER TABLE proveedores ALTER COLUMN nombre DROP NOT NULL').catch(() => {});
        await pool.query('ALTER TABLE proveedores ALTER COLUMN razon_social DROP NOT NULL').catch(() => {});

        const { empresa_nombre } = req.params;
        const result = await pool.query(
            'SELECT * FROM proveedores WHERE empresa_nombre = $1 ORDER BY nombre_comercial ASC',
            [empresa_nombre]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error al obtener proveedores:", err);
        res.status(500).json({ error: err.message || "Error interno al obtener proveedores." });
    }
});

// CREAR UN NUEVO PROVEEDOR
router.post('/', async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS proveedores (
                id SERIAL PRIMARY KEY,
                empresa_nombre VARCHAR(100) NOT NULL
            )
        `);
        await pool.query('ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS nombre_comercial VARCHAR(100)');
        await pool.query('ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS razon_social_cuit VARCHAR(100)');
        await pool.query('ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS contacto VARCHAR(100)');
        await pool.query('ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS email VARCHAR(100)');
        await pool.query('ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        
        // Relajar dependencias de columnas viejas (por si el usuario ya tenía esta tabla)
        await pool.query('ALTER TABLE proveedores ALTER COLUMN nombre DROP NOT NULL').catch(() => {});
        await pool.query('ALTER TABLE proveedores ALTER COLUMN razon_social DROP NOT NULL').catch(() => {});

        const { empresa_nombre, nombre_comercial, razon_social_cuit, contacto, email } = req.body;
        
        if (!empresa_nombre || !nombre_comercial) {
            return res.status(400).json({ error: "El nombre de la empresa y nombre comercial son obligatorios." });
        }

        const result = await pool.query(
            `INSERT INTO proveedores (empresa_nombre, nombre_comercial, razon_social_cuit, contacto, email) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [empresa_nombre, nombre_comercial, razon_social_cuit || null, contacto || null, email || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error al crear proveedor:", err);
        res.status(500).json({ error: err.message || "No se pudo crear el proveedor." });
    }
});

// ACTUALIZAR PROVEEDOR
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_comercial, razon_social_cuit, contacto, email } = req.body;

        const result = await pool.query(
            `UPDATE proveedores 
             SET nombre_comercial = $1, razon_social_cuit = $2, contacto = $3, email = $4 
             WHERE id = $5 RETURNING *`,
            [nombre_comercial, razon_social_cuit || null, contacto || null, email || null, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Proveedor no encontrado" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error al actualizar proveedor:", err);
        res.status(500).json({ error: "Error al actualizar el proveedor." });
    }
});

// ELIMINAR PROVEEDOR
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Postgres SET NULL on delete protects related rows
        const result = await pool.query('DELETE FROM proveedores WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: "Proveedor no encontrado" });
        res.json({ mensaje: "Proveedor eliminado con éxito" });
    } catch (err) {
        console.error("Error al borrar proveedor:", err);
        res.status(500).json({ error: "Error al eliminar el proveedor." });
    }
});

module.exports = router;
