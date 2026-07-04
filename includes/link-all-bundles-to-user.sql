-- ============================================================
-- Koppel ALLE bundels (collections) MET ALLE TIERS aan één gebruiker
-- Gebruiker: casbeumer@gmail.com
-- ============================================================
-- Waarom twee stappen hieronder nodig zijn (zie js/collections.js):
--   - "owned" (koop-knop wordt open-knop) is al waar zodra er
--     ÉÉN rij in user_collections OF purchases staat.
--   - maar welke TIERS (brons/zilver/goud/platinum) je daadwerkelijk
--     te zien krijgt, wordt afgeleid uit de 'purchases'-rijen:
--     de site zoekt de tier-naam terug in item_name
--     (zie detectTierFromText() / inferPurchasedTier()).
--   Dus om ELKE tier van ELKE bundel te kunnen testen heb je per
--   bundel per tier een eigen purchases-rij nodig, niet slechts 1.
--
-- Zoekt de user_id op via e-mailadres (in plaats van een vast id
-- aan te nemen), zodat het script blijft werken ook als het
-- account niet toevallig id 1 heeft.
-- ============================================================

-- ------------------------------------------------------------
-- STAP 1: user_collections -> zet elke bundel op "owned"
-- ------------------------------------------------------------
INSERT IGNORE INTO user_collections (user_id, collection_id)
SELECT u.id, c.collection_id
FROM users u
CROSS JOIN (
    SELECT 'JOI Pakket' AS collection_id
    UNION ALL SELECT 'Custom Video'
    UNION ALL SELECT 'Custom Video (Mistress)'
    UNION ALL SELECT 'Lingerie Pakket'
    UNION ALL SELECT 'Pussyplay Pakket'
    UNION ALL SELECT 'Strapon Pakket'
    UNION ALL SELECT 'CBT Pakket'
    UNION ALL SELECT 'Sissy Pakket'
    UNION ALL SELECT 'Duo Pakket'
    UNION ALL SELECT 'Vibrator/Dildo Pakket'
    UNION ALL SELECT 'Cum Pakket'
    UNION ALL SELECT 'Big Boob Pakket'
    UNION ALL SELECT 'Mix Pakket'
    UNION ALL SELECT 'Voetjes Pakket'
    UNION ALL SELECT 'Striptease Pakket'
    UNION ALL SELECT 'JOI & CEI Pakket'
    UNION ALL SELECT 'Nippleplay Pakket'
    UNION ALL SELECT 'Mix Pakket Meesteres'
    UNION ALL SELECT 'Squirt Bundel'
    UNION ALL SELECT 'Plas/Squirt'
) c
WHERE u.email = 'casbeumer@gmail.com';

-- ------------------------------------------------------------
-- STAP 2: purchases -> één rij per (bundel, tier) zodat ELKE
-- tier los herkend en zichtbaar wordt op de account-pagina.
-- Prijzen komen 1-op-1 uit includes/collections.json.
-- De NOT EXISTS-check maakt dit script veilig om opnieuw te
-- draaien (geen dubbele rijen bij een tweede keer uitvoeren).
-- ------------------------------------------------------------
INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price, payment_status)
SELECT u.id, 'collection', c.collection_id,
       CONCAT(c.collection_id, ' - ', c.tier, ' - Test toegang (alle tiers)'),
       c.price, 'paid'
FROM users u
CROSS JOIN (
    SELECT 'JOI Pakket' AS collection_id, 'brons' AS tier, 35 AS price
    UNION ALL SELECT 'JOI Pakket', 'zilver', 50
    UNION ALL SELECT 'JOI Pakket', 'goud', 75
    UNION ALL SELECT 'JOI Pakket', 'platinum', 100
    UNION ALL SELECT 'Custom Video', 'short', 150
    UNION ALL SELECT 'Custom Video', 'medium', 225
    UNION ALL SELECT 'Custom Video', 'long', 300
    UNION ALL SELECT 'Custom Video (Mistress)', 'short', 150
    UNION ALL SELECT 'Custom Video (Mistress)', 'medium', 225
    UNION ALL SELECT 'Custom Video (Mistress)', 'long', 300
    UNION ALL SELECT 'Lingerie Pakket', 'brons', 35
    UNION ALL SELECT 'Lingerie Pakket', 'zilver', 50
    UNION ALL SELECT 'Lingerie Pakket', 'goud', 75
    UNION ALL SELECT 'Lingerie Pakket', 'platinum', 100
    UNION ALL SELECT 'Pussyplay Pakket', 'brons', 35
    UNION ALL SELECT 'Pussyplay Pakket', 'zilver', 50
    UNION ALL SELECT 'Pussyplay Pakket', 'goud', 75
    UNION ALL SELECT 'Pussyplay Pakket', 'platinum', 100
    UNION ALL SELECT 'Strapon Pakket', 'brons', 35
    UNION ALL SELECT 'Strapon Pakket', 'zilver', 50
    UNION ALL SELECT 'Strapon Pakket', 'goud', 75
    UNION ALL SELECT 'Strapon Pakket', 'platinum', 100
    UNION ALL SELECT 'CBT Pakket', 'brons', 35
    UNION ALL SELECT 'CBT Pakket', 'zilver', 50
    UNION ALL SELECT 'CBT Pakket', 'goud', 75
    UNION ALL SELECT 'CBT Pakket', 'platinum', 100
    UNION ALL SELECT 'Sissy Pakket', 'brons', 10
    UNION ALL SELECT 'Sissy Pakket', 'zilver', 20
    UNION ALL SELECT 'Sissy Pakket', 'goud', 30
    UNION ALL SELECT 'Sissy Pakket', 'platinum', 40
    UNION ALL SELECT 'Duo Pakket', 'brons', 35
    UNION ALL SELECT 'Duo Pakket', 'zilver', 50
    UNION ALL SELECT 'Duo Pakket', 'goud', 75
    UNION ALL SELECT 'Duo Pakket', 'platinum', 100
    UNION ALL SELECT 'Vibrator/Dildo Pakket', 'brons', 35
    UNION ALL SELECT 'Vibrator/Dildo Pakket', 'zilver', 50
    UNION ALL SELECT 'Vibrator/Dildo Pakket', 'goud', 75
    UNION ALL SELECT 'Vibrator/Dildo Pakket', 'platinum', 100
    UNION ALL SELECT 'Cum Pakket', 'brons', 35
    UNION ALL SELECT 'Cum Pakket', 'zilver', 50
    UNION ALL SELECT 'Cum Pakket', 'goud', 75
    UNION ALL SELECT 'Cum Pakket', 'platinum', 100
    UNION ALL SELECT 'Big Boob Pakket', 'brons', 35
    UNION ALL SELECT 'Big Boob Pakket', 'zilver', 50
    UNION ALL SELECT 'Big Boob Pakket', 'goud', 75
    UNION ALL SELECT 'Big Boob Pakket', 'platinum', 100
    UNION ALL SELECT 'Mix Pakket', 'brons', 35
    UNION ALL SELECT 'Mix Pakket', 'zilver', 50
    UNION ALL SELECT 'Mix Pakket', 'goud', 75
    UNION ALL SELECT 'Mix Pakket', 'platinum', 100
    UNION ALL SELECT 'Voetjes Pakket', 'brons', 35
    UNION ALL SELECT 'Voetjes Pakket', 'zilver', 50
    UNION ALL SELECT 'Voetjes Pakket', 'goud', 75
    UNION ALL SELECT 'Voetjes Pakket', 'platinum', 100
    UNION ALL SELECT 'Striptease Pakket', 'brons', 35
    UNION ALL SELECT 'Striptease Pakket', 'zilver', 50
    UNION ALL SELECT 'Striptease Pakket', 'goud', 75
    UNION ALL SELECT 'Striptease Pakket', 'platinum', 100
    UNION ALL SELECT 'JOI & CEI Pakket', 'brons', 35
    UNION ALL SELECT 'JOI & CEI Pakket', 'zilver', 50
    UNION ALL SELECT 'JOI & CEI Pakket', 'goud', 75
    UNION ALL SELECT 'JOI & CEI Pakket', 'platinum', 100
    UNION ALL SELECT 'Nippleplay Pakket', 'brons', 35
    UNION ALL SELECT 'Nippleplay Pakket', 'zilver', 50
    UNION ALL SELECT 'Nippleplay Pakket', 'goud', 75
    UNION ALL SELECT 'Nippleplay Pakket', 'platinum', 100
    UNION ALL SELECT 'Mix Pakket Meesteres', 'brons', 35
    UNION ALL SELECT 'Mix Pakket Meesteres', 'zilver', 50
    UNION ALL SELECT 'Mix Pakket Meesteres', 'goud', 75
    UNION ALL SELECT 'Mix Pakket Meesteres', 'platinum', 100
    UNION ALL SELECT 'Squirt Bundel', 'brons', 35
    UNION ALL SELECT 'Squirt Bundel', 'zilver', 50
    UNION ALL SELECT 'Squirt Bundel', 'goud', 75
    UNION ALL SELECT 'Squirt Bundel', 'platinum', 100
    UNION ALL SELECT 'Plas/Squirt', 'brons', 35
    UNION ALL SELECT 'Plas/Squirt', 'zilver', 50
    UNION ALL SELECT 'Plas/Squirt', 'goud', 75
    UNION ALL SELECT 'Plas/Squirt', 'platinum', 100
) c
WHERE u.email = 'casbeumer@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM purchases p2
      WHERE p2.user_id = u.id
        AND p2.item_id = c.collection_id
        AND p2.item_name LIKE CONCAT('%', c.tier, '%')
  );

-- ============================================================
-- Controle: bekijk welke bundels + tiers nu gekoppeld zijn
-- ============================================================
-- SELECT item_id, item_name, price, payment_status
-- FROM purchases p
-- JOIN users u ON u.id = p.user_id
-- WHERE u.email = 'casbeumer@gmail.com'
-- ORDER BY item_id;
