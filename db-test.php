<?php
/* ============================================================
   STANDALONE DATABASE TEST
   Upload alleen dit bestand naar je root directory
   Ga naar: https://miss-jolie.store/db-test.php
   
   VERWIJDER NA HET TESTEN!
============================================================ */

echo "<!DOCTYPE html>
<html>
<head>
    <title>Database Test</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        pre { background: #fff; padding: 10px; border-left: 3px solid #ff66c4; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔍 Database Connectie Test</h1>
    <hr>
";

// Database credentials
$host = 'iLnl10-i-web100-sv-teamblue-gps.net';
$dbname = 'missjo_dubbelgekraagd';
$user = 'missjo_admin';
$pass = 'Verschuren2001!#$%';

echo "<h2>Test 1: Database Credentials</h2>";
echo "<pre>";
echo "Host:     $host\n";
echo "Database: $dbname\n";
echo "User:     $user\n";
echo "Password: " . str_repeat('*', strlen($pass)) . "\n";
echo "</pre>";

echo "<h2>Test 2: PDO Extension Check</h2>";
if (extension_loaded('pdo_mysql')) {
    echo "<p class='success'>✅ PDO MySQL extensie is beschikbaar</p>";
} else {
    echo "<p class='error'>❌ PDO MySQL extensie is NIET beschikbaar!</p>";
    echo "<p>Neem contact op met je hosting provider.</p>";
    die();
}

echo "<h2>Test 3: Database Connectie</h2>";
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    echo "<p class='success'>✅ Connectie SUCCESVOL!</p>";
    
    // Test query
    echo "<h2>Test 4: Database Query Test</h2>";
    $stmt = $pdo->query("SELECT DATABASE() as db_name, VERSION() as version");
    $result = $stmt->fetch();
    
    echo "<p class='success'>✅ Query succesvol uitgevoerd</p>";
    echo "<pre>";
    echo "Verbonden met: " . $result['db_name'] . "\n";
    echo "MySQL versie:  " . $result['version'] . "\n";
    echo "</pre>";
    
    // Check tabellen
    echo "<h2>Test 5: Tabellen Check</h2>";
    $tables = ['users', 'purchases', 'user_collections', 'user_sessions'];
    
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%; background: white;'>";
    echo "<tr style='background: #ff66c4; color: white;'><th>Tabel</th><th>Status</th><th>Aantal rijen</th></tr>";
    
    $allTablesExist = true;
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            $countStmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $count = $countStmt->fetch()['count'];
            echo "<tr><td>$table</td><td class='success'>✅ Bestaat</td><td>$count</td></tr>";
        } else {
            echo "<tr><td>$table</td><td class='error'>❌ Bestaat NIET</td><td>-</td></tr>";
            $allTablesExist = false;
        }
    }
    echo "</table>";
    
    // Final result
    echo "<hr>";
    if ($allTablesExist) {
        echo "<div class='info'>";
        echo "<h2 style='color: green;'>🎉 ALLE TESTS GESLAAGD!</h2>";
        echo "<p>Je database werkt perfect. Je kunt nu:</p>";
        echo "<ul>";
        echo "<li>Accounts aanmaken via /registreer.html</li>";
        echo "<li>Inloggen via /login.html</li>";
        echo "<li>Je aankopen synchroniseren tussen devices</li>";
        echo "</ul>";
        echo "<p><strong style='color: red;'>⚠️ VERWIJDER dit bestand (db-test.php) NU voor de veiligheid!</strong></p>";
        echo "</div>";
    } else {
        echo "<div class='info'>";
        echo "<h2 style='color: orange;'>⚠️ Sommige tabellen ontbreken</h2>";
        echo "<p>Ga naar phpMyAdmin en importeer: <code>database-setup-transip.sql</code></p>";
        echo "</div>";
    }
    
} catch (PDOException $e) {
    echo "<p class='error'>❌ CONNECTIE MISLUKT!</p>";
    echo "<h3>Error Details:</h3>";
    echo "<pre style='background: #ffebee; border-color: #f44336;'>";
    echo $e->getMessage();
    echo "</pre>";
    
    echo "<h3>Mogelijke Oplossingen:</h3>";
    echo "<ul>";
    echo "<li>Check of de hostname correct is: <code>$host</code></li>";
    echo "<li>Check of de database bestaat: <code>$dbname</code></li>";
    echo "<li>Check of de gebruikersnaam correct is: <code>$user</code></li>";
    echo "<li>Check het wachtwoord in TransIP controlpanel</li>";
    echo "<li>Check of de database gebruiker rechten heeft op deze database</li>";
    echo "</ul>";
}

echo "</body></html>";
?>
