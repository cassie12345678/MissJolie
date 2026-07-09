-- ============================================================
-- MIGRATION: ADD discount_code / discount_amount COLUMNS TO purchases TABLE
-- Voer dit uit als je database al bestaat
-- ============================================================

USE missjolie_db;

ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50) NULL AFTER payment_status,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NULL DEFAULT 0 AFTER discount_code;

-- ============================================================
-- KLAAR! discount_code en discount_amount kolommen zijn toegevoegd
-- ============================================================
