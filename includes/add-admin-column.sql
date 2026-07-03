-- ============================================================
-- MIGRATION: ADD is_admin COLUMN TO USERS TABLE
-- Voer dit uit als je database al bestaat
-- ============================================================

USE missjolie_db;

-- Voeg is_admin kolom toe als deze nog niet bestaat
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin TINYINT(1) DEFAULT 0 AFTER password_hash;

-- Optioneel: Maak een admin account
-- Verander het email adres naar jouw admin email
-- Het wachtwoord is: admin123 (wijzig dit na eerste inlog!)
-- INSERT INTO users (email, password_hash, is_admin) 
-- VALUES ('admin@missjolie.nl', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1)
-- ON DUPLICATE KEY UPDATE is_admin = 1;

-- ============================================================
-- KLAAR! is_admin kolom is toegevoegd
-- ============================================================
