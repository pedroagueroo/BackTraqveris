-- ==============================================================================
-- db_migration.sql
-- MIGRACIÓN PARA TRAVERIS PRO SAAS
-- Instrucciones: Ejecuta este script en tu base de datos PostgreSQL de Neon.
-- ==============================================================================

-- 1. Añadir columnas a movimientos_caja para trazabilidad de pagos completa
ALTER TABLE movimientos_caja 
ADD COLUMN IF NOT EXISTS banco VARCHAR(100),
ADD COLUMN IF NOT EXISTS numero_tarjeta VARCHAR(50),
ADD COLUMN IF NOT EXISTS cuotas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS detalle_transaccion TEXT;

-- 2. Añadir columnas a reservas para Soft Delete y Moneda Base
-- estado_eliminado: Permite "eliminar" registros visualmente conservando integridad contable.
-- moneda_pago: Define si la reserva se cotiza en USD, ARS o EUR.
ALTER TABLE reservas 
ADD COLUMN IF NOT EXISTS estado_eliminado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS moneda_pago VARCHAR(10) DEFAULT 'USD';

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
