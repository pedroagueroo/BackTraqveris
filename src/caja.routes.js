// ============================================================================
// CAJA ROUTES — Rutas de caja operativa (conversión, movimientos por reserva)
// ============================================================================
// CORRECCIONES APLICADAS:
//   Bug 4: JOIN → LEFT JOIN en ultimos/:empresa (movimientos sin reserva ahora aparecen)
//   MEJORADO: Filtro de empresa en movimientos directos (no solo por reserva)
//   MEJORADO: Validaciones en POST y DELETE
// ============================================================================

const express = require('express');
const router = express.Router();
const pool = require('./db');
const { obtenerCotizacionDolar } = require('./cotizacion.service');
const { sqlCaseMonto } = require('./constantes');

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONVERTIR MONEDA (Transacción atómica)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/convertir-moneda', async (req, res) => {
    const client = await pool.connect();
    try {
        let { id_reserva, monto_origen, moneda_origen, moneda_destino, cotizacion, empresa_nombre } = req.body;
        
        // Validaciones
        if (!monto_origen || monto_origen <= 0) {
            return res.status(400).json({ error: "El monto debe ser mayor a 0" });
        }
        if (!moneda_origen || !moneda_destino) {
            return res.status(400).json({ error: "Debe indicar moneda de origen y destino" });
        }
        if (moneda_origen === moneda_destino) {
            return res.status(400).json({ error: "Las monedas de origen y destino deben ser diferentes" });
        }

        if (!cotizacion) {
            cotizacion = await obtenerCotizacionDolar();
            if (!cotizacion) return res.status(500).json({ error: "No se pudo obtener la cotización." });
        }

        await client.query('BEGIN');
        
        // Salida de la moneda origen
        await client.query(
            `INSERT INTO movimientos_caja (id_reserva, monto, moneda, tipo_movimiento, metodo_pago, empresa_nombre, fecha_pago) 
             VALUES ($1, $2, $3, 'CONVERSION_SALIDA', 'EFECTIVO', $4, CURRENT_TIMESTAMP)`,
            [id_reserva || null, monto_origen, moneda_origen, empresa_nombre]
        );
        
        // Cálculo del monto destino
        const monto_destino = (moneda_origen === 'ARS') 
            ? (monto_origen / cotizacion) 
            : (monto_origen * cotizacion);

        // Entrada de la moneda destino
        await client.query(
            `INSERT INTO movimientos_caja (id_reserva, monto, moneda, tipo_movimiento, metodo_pago, empresa_nombre, fecha_pago) 
             VALUES ($1, $2, $3, 'CONVERSION_ENTRADA', 'EFECTIVO', $4, CURRENT_TIMESTAMP)`,
            [id_reserva || null, monto_destino, moneda_destino, empresa_nombre]
        );
        
        await client.query('COMMIT');
        res.json({ 
            mensaje: "Conversión realizada", 
            cotizacion_utilizada: cotizacion, 
            monto_convertido: parseFloat(monto_destino.toFixed(2))
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error en conversión:", err);
        res.status(500).json({ error: "Error en la conversión" });
    } finally { 
        client.release(); 
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. OBTENER MOVIMIENTOS DE UNA RESERVA
// ─────────────────────────────────────────────────────────────────────────────
router.get('/reserva/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM movimientos_caja WHERE id_reserva = $1 ORDER BY fecha_pago DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error al obtener movimientos de reserva:", err);
        res.status(500).json({ error: "Error al obtener movimientos" });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ÚLTIMOS MOVIMIENTOS (Dashboard) 
// CORREGIDO: LEFT JOIN para que aparezcan gastos sin reserva asociada
// CORREGIDO: Filtra por empresa_nombre directo, no solo por reserva
// ─────────────────────────────────────────────────────────────────────────────
router.get('/ultimos/:empresa', async (req, res) => {
    try {
        const { empresa } = req.params;
        const result = await pool.query(`
            SELECT m.*, r.id as nro_legajo, r.destino_final
            FROM movimientos_caja m
            LEFT JOIN reservas r ON m.id_reserva = r.id
            WHERE m.empresa_nombre = $1
            ORDER BY m.fecha_pago DESC 
            LIMIT 10`, [empresa]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en movimientos recientes:", err);
        res.status(500).json({ error: "Error en movimientos recientes" });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. REGISTRAR PAGO (ruta legacy para compatibilidad)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const { id_reserva, monto, moneda, tipo_movimiento, empresa_nombre, banco, numero_tarjeta, cuotas, detalle_transaccion } = req.body;
    
    if (monto === undefined || monto === null) {
        return res.status(400).json({ error: "El monto es obligatorio" });
    }
    
    try {
        const nuevo = await pool.query(
            `INSERT INTO movimientos_caja 
             (id_reserva, monto, moneda, tipo_movimiento, empresa_nombre, fecha_pago, banco, numero_tarjeta, cuotas, detalle_transaccion) 
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7, $8, $9) RETURNING *`, 
            [id_reserva, monto, moneda, tipo_movimiento, empresa_nombre, banco, numero_tarjeta, cuotas || 1, detalle_transaccion]
        );
        res.json(nuevo.rows[0]);
    } catch (err) { 
        console.error("Error al registrar:", err);
        res.status(500).json({ error: "Error al registrar" }); 
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ELIMINAR MOVIMIENTO (con verificación)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM movimientos_caja WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Movimiento no encontrado" });
        }

        res.json({ mensaje: "Movimiento eliminado correctamente" });
    } catch (err) {
        console.error("Error al eliminar movimiento:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. GESTIÓN DE MÉTODOS DE PAGO: TARJETAS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tarjetas/:empresa', async (req, res) => {
    try {
        const { empresa } = req.params;
        const result = await pool.query('SELECT * FROM medios_tarjeta WHERE empresa_nombre = $1 ORDER BY id DESC', [empresa]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener tarjetas" });
    }
});

router.post('/tarjetas', async (req, res) => {
    const { empresa_nombre, nombre_banco, franquicia, nro_tarjeta_completo, vencimiento } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO medios_tarjeta (empresa_nombre, nombre_banco, franquicia, nro_tarjeta_completo, vencimiento) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [empresa_nombre, nombre_banco, franquicia, nro_tarjeta_completo, vencimiento]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al guardar tarjeta" });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. GESTIÓN DE MÉTODOS DE PAGO: TRANSFERENCIAS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/transferencias/:empresa', async (req, res) => {
    try {
        const { empresa } = req.params;
        const result = await pool.query('SELECT * FROM medios_transferencia WHERE empresa_nombre = $1 ORDER BY id DESC', [empresa]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener medios de transferencia" });
    }
});

router.post('/transferencias', async (req, res) => {
    const { empresa_nombre, banco_alias, cbu_cvu, titular } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO medios_transferencia (empresa_nombre, banco_alias, cbu_cvu, titular) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [empresa_nombre, banco_alias, cbu_cvu, titular]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al guardar medio de transferencia" });
    }
});

module.exports = router;