<?php
/* ============================================================
   DATABASE CONFIGURATIE
   Pas deze gegevens aan naar jouw hosting database
============================================================ */

// Database connectie gegevens
define('DB_HOST', '127.0.0.1'); // TransIP MySQL (socket werkt niet, gebruik TCP via 127.0.0.1)
define('DB_NAME', 'missjo_dubbelgekraagd');                // Jouw database naam
define('DB_USER', 'missjo_admin');                         // Jouw database gebruikersnaam
define('DB_PASS', 'Verschuren2001!#$%');                   // Jouw database wachtwoord
define('DB_CHARSET', 'utf8mb4');

// Maak PDO connectie
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    // Log error maar toon geen details aan gebruiker
    error_log("Database connectie fout: " . $e->getMessage());
    die(json_encode(["success" => false, "message" => "Database verbinding mislukt"]));
}

// Start sessie als nog niet gestart
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
