-- ==============================================================================
-- db_migration_v2.sql
-- MIGRACIÓN PARA TRAVERIS PRO SAAS (PARTE 2)
-- ==============================================================================

-- Añadir columna moneda_pago a la tabla reservas
ALTER TABLE reservas 
ADD COLUMN IF NOT EXISTS moneda_pago VARCHAR(10) DEFAULT 'USD';

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
