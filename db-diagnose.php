<?php
// TIJDELIJK DIAGNOSE BESTAND - VERWIJDER NA GEBRUIK
// Ga naar: https://miss-jolie.store/db-diagnose.php

$hosts = ['localhost', '127.0.0.1', 'mysql'];
$dbname = 'missjo_dubbelgekraagd';
$user   = 'missjo_admin';
$pass   = 'Verschuren2001!#$%';

echo '<pre style="font-family:monospace;padding:20px">';
echo "=== DB DIAGNOSE ===\n\n";
echo "Database: $dbname\n";
echo "Gebruiker: $user\n\n";

foreach ($hosts as $host) {
    echo "Test host: $host ... ";
    try {
        $pdo = new PDO(
            "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
            $user, $pass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]
        );
        echo "VERBONDEN!\n";
        $row = $pdo->query("SELECT DATABASE(), VERSION()")->fetch(PDO::FETCH_NUM);
        echo "  Database: {$row[0]}\n";
        echo "  MySQL versie: {$row[1]}\n";
        echo "\n*** Gebruik deze host in db-config.php: $host ***\n";
        break;
    } catch (PDOException $e) {
        echo "MISLUKT\n";
        echo "  Fout: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

echo '</pre>';
echo '<p style="color:red;font-weight:bold">VERWIJDER DIT BESTAND NA GEBRUIK (db-diagnose.php)</p>';
?>
