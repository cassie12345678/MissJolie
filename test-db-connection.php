<?php
/* ============================================================
   DATABASE TEST - Upload naar server en open in browser
   https://miss-jolie.store/test-db-connection.php
   VERWIJDER NA HET TESTEN!
============================================================ */

// Database credentials
$host = '127.0.0.1';
$dbname = 'missjo_dubbelgekraagd';
$user = 'missjo_admin';
$pass = 'Verschuren2001!#$%';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Database Test</title>
    <style>
        body { font-family: Arial; max-width: 900px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
        h1 { color: #ff66c4; }
        h2 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        pre { background: #f8f8f8; padding: 15px; border-left: 4px solid #ff66c4; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th { background: #ff66c4; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🔍 Database Connectie Test - Miss Jolie</h1>
    
    <div class="box">
        <h2>Test 1: Database Credentials</h2>
        <pre>Host:     <?php echo $host; ?>
Database: <?php echo $dbname; ?>
User:     <?php echo $user; ?>
Password: <?php echo str_repeat('*', strlen($pass)); ?></pre>
    </div>

<?php
// Test PDO Extension
echo '<div class="box">';
echo '<h2>Test 2: PDO MySQL Extension</h2>';
if (extension_loaded('pdo_mysql')) {
    echo '<p class="success">✅ PDO MySQL extension is beschikbaar</p>';
} else {
    echo '<p class="error">❌ PDO MySQL extension NIET beschikbaar!</p>';
    echo '</div></body></html>';
    die();
}
echo '</div>';

// Test Database Connection
echo '<div class="box">';
echo '<h2>Test 3: Database Connectie</h2>';

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
    
    echo '<p class="success">✅ Database connectie SUCCESVOL!</p>';
    
    // Get database info
    $stmt = $pdo->query("SELECT DATABASE() as db, VERSION() as version");
    $info = $stmt->fetch();
    
    echo '<pre>Verbonden met: ' . $info['db'] . '
MySQL versie:  ' . $info['version'] . '</pre>';
    
    echo '</div>';
    
    // Check Tables
    echo '<div class="box">';
    echo '<h2>Test 4: Database Tabellen</h2>';
    
    $tables = ['users', 'purchases', 'user_collections', 'user_sessions'];
    
    echo '<table>';
    echo '<tr><th>Tabel</th><th>Status</th><th>Aantal Rijen</th><th>Structuur</th></tr>';
    
    $allTablesExist = true;
    
    foreach ($tables as $table) {
        echo '<tr>';
        echo '<td><strong>' . $table . '</strong></td>';
        
        // Check if table exists
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            // Count rows
            $countStmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $count = $countStmt->fetch()['count'];
            
            // Get columns
            $colStmt = $pdo->query("SHOW COLUMNS FROM $table");
            $columns = $colStmt->fetchAll();
            $colNames = array_column($columns, 'Field');
            
            echo '<td class="success">✅ Bestaat</td>';
            echo '<td>' . $count . '</td>';
            echo '<td><small>' . implode(', ', array_slice($colNames, 0, 5)) . '...</small></td>';
        } else {
            echo '<td class="error">❌ Bestaat NIET</td>';
            echo '<td>-</td>';
            echo '<td>-</td>';
            $allTablesExist = false;
        }
        
        echo '</tr>';
    }
    
    echo '</table>';
    echo '</div>';
    
    // Final Result
    echo '<div class="box">';
    if ($allTablesExist) {
        echo '<h2 style="color: green;">🎉 ALLE TESTS GESLAAGD!</h2>';
        echo '<p>Je database is volledig ingesteld en werkt perfect!</p>';
        echo '<ul>';
        echo '<li>✅ Database connectie werkt</li>';
        echo '<li>✅ Alle tabellen bestaan</li>';
        echo '<li>✅ Inlog systeem is klaar voor gebruik</li>';
        echo '</ul>';
        echo '<p><strong>Je kunt nu:</strong></p>';
        echo '<ul>';
        echo '<li>Accounts aanmaken: <a href="registreer.html">registreer.html</a></li>';
        echo '<li>Inloggen: <a href="login.html">login.html</a></li>';
        echo '<li>Account pagina bekijken: <a href="account.html">account.html</a></li>';
        echo '</ul>';
        echo '<div class="warning">';
        echo '<strong>⚠️ BELANGRIJK:</strong> Verwijder dit bestand (test-db-connection.php) NU voor de veiligheid!';
        echo '</div>';
    } else {
        echo '<h2 style="color: orange;">⚠️ Sommige tabellen ontbreken</h2>';
        echo '<p><strong>Oplossing:</strong></p>';
        echo '<ol>';
        echo '<li>Ga naar <a href="https://nl01-phpmyadmin.transip.me/" target="_blank">TransIP phpMyAdmin</a></li>';
        echo '<li>Selecteer database: <code>missjo_dubbelgekraagd</code></li>';
        echo '<li>Klik op "Import" tab</li>';
        echo '<li>Upload: <code>database-setup-transip.sql</code></li>';
        echo '<li>Klik op "Go"</li>';
        echo '<li>Refresh deze pagina</li>';
        echo '</ol>';
    }
    echo '</div>';
    
} catch (PDOException $e) {
    echo '<p class="error">❌ CONNECTIE MISLUKT!</p>';
    echo '<pre style="background: #ffebee; border-color: #f44336;">Error: ' . $e->getMessage() . '</pre>';
    
    echo '<h3>Mogelijke Oplossingen:</h3>';
    echo '<ul>';
    echo '<li>Check hostname in db-config.php (moet <code>localhost</code> zijn)</li>';
    echo '<li>Check database naam: <code>' . $dbname . '</code></li>';
    echo '<li>Check gebruikersnaam: <code>' . $user . '</code></li>';
    echo '<li>Check wachtwoord in TransIP controlpanel</li>';
    echo '<li>Check of database bestaat in phpMyAdmin</li>';
    echo '</ul>';
    echo '</div>';
}
?>

</body>
</html>