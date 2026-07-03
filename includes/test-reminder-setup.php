<?php
/* ============================================================
   TEST REMINDER SETUP
   Dit script controleert of de reminder kolommen bestaan en
   test of de reminder emails werken
============================================================ */

require_once 'db-config.php';

echo "<!DOCTYPE html>
<html>
<head>
    <title>Reminder Setup Test</title>
    <style>
        body { font-family: Arial; max-width: 900px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
        h1 { color: #d896ff; }
        h2 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        pre { background: #f8f8f8; padding: 15px; border-left: 4px solid #d896ff; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th { background: #d896ff; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .btn { background: #d896ff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; text-decoration: none; display: inline-block; }
        .btn:hover { background: #c785e8; }
    </style>
</head>
<body>
    <h1>🔍 Reminder Setup Test</h1>
";

try {
    // ===================================================================
    // TEST 1: Check if reminder columns exist in bookings table
    // ===================================================================
    echo "<div class='box'>";
    echo "<h2>Test 1: Database Kolommen Check</h2>";
    
    $stmt = $pdo->query("DESCRIBE bookings");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $requiredColumns = [
        'reminder_1h_sent' => false,
        'reminder_1h_sent_at' => false,
        'reminder_5m_sent' => false,
        'reminder_5m_sent_at' => false,
        'video_call_link' => false
    ];
    
    foreach ($columns as $column) {
        if (isset($requiredColumns[$column['Field']])) {
            $requiredColumns[$column['Field']] = true;
        }
    }
    
    echo "<table>";
    echo "<tr><th>Kolom</th><th>Status</th></tr>";
    foreach ($requiredColumns as $colName => $exists) {
        if ($exists) {
            echo "<tr><td>$colName</td><td class='success'>✓ Bestaat</td></tr>";
        } else {
            echo "<tr><td>$colName</td><td class='error'>✗ Ontbreekt</td></tr>";
        }
    }
    echo "</table>";
    
    $missingColumns = array_keys(array_filter($requiredColumns, function($v) { return !$v; }));
    
    if (count($missingColumns) > 0) {
        echo "<div class='warning'>";
        echo "<strong>⚠️ ACTIE VEREIST:</strong> De volgende kolommen ontbreken:<br>";
        echo "Voer dit SQL commando uit in je database:<br><br>";
        echo "<pre>ALTER TABLE bookings 
ADD COLUMN reminder_1h_sent TINYINT(1) DEFAULT 0,
ADD COLUMN reminder_1h_sent_at DATETIME NULL,
ADD COLUMN reminder_5m_sent TINYINT(1) DEFAULT 0,
ADD COLUMN reminder_5m_sent_at DATETIME NULL,
ADD COLUMN video_call_link VARCHAR(500) NULL,
ADD INDEX idx_reminder_1h (reminder_1h_sent, booking_date, booking_time),
ADD INDEX idx_reminder_5m (reminder_5m_sent, booking_date, booking_time);</pre>";
        echo "</div>";
    } else {
        echo "<p class='success'>✓ Alle benodigde kolommen zijn aanwezig!</p>";
    }
    
    echo "</div>";
    
    // ===================================================================
    // TEST 2: Check upcoming bookings
    // ===================================================================
    echo "<div class='box'>";
    echo "<h2>Test 2: Aankomende Bookings</h2>";
    
    $stmt = $pdo->query("
        SELECT 
            id, 
            customer_name, 
            customer_email, 
            booking_date, 
            booking_time, 
            status,
            payment_status,
            TIMESTAMPDIFF(MINUTE, NOW(), CONCAT(booking_date, ' ', booking_time)) as minutes_until
        FROM bookings 
        WHERE status = 'confirmed' 
        AND payment_status = 'paid'
        AND CONCAT(booking_date, ' ', booking_time) > NOW()
        ORDER BY booking_date, booking_time
        LIMIT 10
    ");
    $upcomingBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($upcomingBookings) > 0) {
        echo "<p>Gevonden: <strong>" . count($upcomingBookings) . "</strong> aankomende bevestigde bookings</p>";
        echo "<table>";
        echo "<tr><th>ID</th><th>Klant</th><th>Email</th><th>Datum & Tijd</th><th>Over (minuten)</th></tr>";
        foreach ($upcomingBookings as $booking) {
            echo "<tr>";
            echo "<td>#" . $booking['id'] . "</td>";
            echo "<td>" . htmlspecialchars($booking['customer_name']) . "</td>";
            echo "<td>" . htmlspecialchars($booking['customer_email']) . "</td>";
            echo "<td>" . $booking['booking_date'] . " " . substr($booking['booking_time'], 0, 5) . "</td>";
            echo "<td>" . $booking['minutes_until'] . " min</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p class='warning'>⚠️ Geen aankomende bookings gevonden met status 'confirmed' en payment_status 'paid'</p>";
        echo "<p>Om reminders te testen, zorg dat je:</p>";
        echo "<ul>";
        echo "<li>Een booking hebt met status = 'confirmed'</li>";
        echo "<li>Met payment_status = 'paid'</li>";
        echo "<li>Met een datum/tijd in de toekomst</li>";
        echo "</ul>";
    }
    
    echo "</div>";
    
    // ===================================================================
    // TEST 3: Check email functionality
    // ===================================================================
    echo "<div class='box'>";
    echo "<h2>Test 3: Email Functionaliteit</h2>";
    
    if (file_exists('email-template.php')) {
        echo "<p class='success'>✓ email-template.php bestaat</p>";
        
        // Test email versturen (alleen als er een test parameter is)
        if (isset($_GET['test_email']) && !empty($_GET['test_email'])) {
            require_once 'email-template.php';
            
            $testEmail = filter_var($_GET['test_email'], FILTER_VALIDATE_EMAIL);
            if ($testEmail) {
                $emailContent = '
                    <h2 style="color: #d896ff;">🧪 Test Email - Reminder Systeem</h2>
                    <p>Hallo,</p>
                    <p>Dit is een test email om te controleren of het reminder systeem correct werkt.</p>
                    <p>Als je deze email ontvangt, is de email functionaliteit werkend!</p>
                    <p style="margin-top: 30px;">Groetjes,<br><strong style="color: #d896ff;">Miss Jolie</strong></p>
                ';
                
                if (sendHtmlEmail($testEmail, "🧪 Test - Reminder Systeem Werkt!", $emailContent)) {
                    echo "<p class='success'>✓ Test email verstuurd naar: $testEmail</p>";
                    echo "<p>Check je inbox (en spam folder)!</p>";
                } else {
                    echo "<p class='error'>✗ Email versturen mislukt!</p>";
                }
            }
        } else {
            echo "<p>Test de email functionaliteit:</p>";
            echo "<form method='get'>";
            echo "<input type='email' name='test_email' placeholder='jouw@email.com' required style='padding: 10px; border: 1px solid #ddd; border-radius: 5px; width: 300px;'>";
            echo "<button type='submit' class='btn'>📧 Verstuur Test Email</button>";
            echo "</form>";
        }
    } else {
        echo "<p class='error'>✗ email-template.php niet gevonden!</p>";
    }
    
    echo "</div>";
    
    // ===================================================================
    // TEST 4: Manual reminder test
    // ===================================================================
    echo "<div class='box'>";
    echo "<h2>Test 4: Manual Reminder Test</h2>";
    
    if (isset($_GET['send_reminder']) && isset($_GET['booking_id'])) {
        $bookingId = (int)$_GET['booking_id'];
        
        // Haal booking op
        $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($booking) {
            require_once 'email-template.php';
            
            $bookingDateTime = new DateTime($booking['booking_date'] . ' ' . $booking['booking_time']);
            $bookingDate = $bookingDateTime->format('l j F Y');
            $bookingTime = substr($booking['booking_time'], 0, 5);
            
            $emailContent = '
                <h2 style="color: #d896ff;">⏰ TEST REMINDER - Je Sessie Details</h2>
                <p>Hallo ' . htmlspecialchars($booking['customer_name']) . ',</p>
                <p>Dit is een <strong>TEST EMAIL</strong> van het reminder systeem.</p>
                
                <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #d896ff; margin-top: 0;">📅 Jouw Afspraak Details</h3>
                    <p style="margin: 8px 0;"><strong>Service:</strong> ' . htmlspecialchars($booking['service']) . '</p>
                    <p style="margin: 8px 0;"><strong>Duur:</strong> ' . htmlspecialchars($booking['duration']) . '</p>
                    <p style="margin: 8px 0;"><strong>Datum:</strong> ' . $bookingDate . '</p>
                    <p style="margin: 8px 0;"><strong>Tijd:</strong> ' . $bookingTime . '</p>
                </div>
                
                <p style="margin-top: 30px;">Groetjes,<br><strong style="color: #d896ff;">Miss Jolie</strong></p>
            ';
            
            if (sendHtmlEmail($booking['customer_email'], "🧪 TEST - Reminder Systeem", $emailContent)) {
                echo "<p class='success'>✓ Test reminder verstuurd naar: " . htmlspecialchars($booking['customer_email']) . "</p>";
            } else {
                echo "<p class='error'>✗ Test reminder versturen mislukt!</p>";
            }
        } else {
            echo "<p class='error'>✗ Booking niet gevonden!</p>";
        }
    }
    
    // Toon bookings waar je test reminder naar kunt sturen
    $stmt = $pdo->query("
        SELECT id, customer_name, customer_email, booking_date, booking_time, status
        FROM bookings 
        WHERE status = 'confirmed'
        ORDER BY booking_date DESC, booking_time DESC
        LIMIT 5
    ");
    $testBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($testBookings) > 0) {
        echo "<p>Verstuur een test reminder naar één van deze bookings:</p>";
        echo "<table>";
        echo "<tr><th>ID</th><th>Klant</th><th>Email</th><th>Datum & Tijd</th><th>Actie</th></tr>";
        foreach ($testBookings as $booking) {
            echo "<tr>";
            echo "<td>#" . $booking['id'] . "</td>";
            echo "<td>" . htmlspecialchars($booking['customer_name']) . "</td>";
            echo "<td>" . htmlspecialchars($booking['customer_email']) . "</td>";
            echo "<td>" . $booking['booking_date'] . " " . substr($booking['booking_time'], 0, 5) . "</td>";
            echo "<td><a href='?send_reminder=1&booking_id=" . $booking['id'] . "' class='btn'>📧 Test Reminder</a></td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p class='warning'>⚠️ Geen bevestigde bookings gevonden om te testen</p>";
    }
    
    echo "</div>";
    
    // ===================================================================
    // INFO: Hoe reminders activeren
    // ===================================================================
    echo "<div class='box'>";
    echo "<h2>📋 Hoe Activeer Je Automatische Reminders?</h2>";
    echo "<ol>";
    echo "<li><strong>Database Setup:</strong> Zorg dat alle kolommen bestaan (zie Test 1 hierboven)</li>";
    echo "<li><strong>Email Test:</strong> Test of emails werken (zie Test 3 hierboven)</li>";
    echo "<li><strong>Cron Job:</strong> Stel een cron job in op je server:</li>";
    echo "</ol>";
    echo "<pre># Open crontab editor op je server:
crontab -e

# Voeg deze regel toe (draait elke 5 minuten):
*/5 * * * * php /pad/naar/send-booking-reminders-v2.php >> /pad/naar/booking-reminders-log.txt 2>&1

# Of gebruik de Windows batch file:
# Plan een Windows Taak Scheduler die run-booking-reminders.bat elke 5 minuten draait</pre>";
    
    echo "<p><strong>TransIP Gebruikers:</strong></p>";
    echo "<ol>";
    echo "<li>Log in op TransIP Control Panel</li>";
    echo "<li>Ga naar 'Cron Jobs'</li>";
    echo "<li>Maak een nieuwe cron job aan</li>";
    echo "<li>Stel in: <code>*/5 * * * *</code> (elke 5 minuten)</li>";
    echo "<li>Commando: <code>php /path/to/send-booking-reminders-v2.php</code></li>";
    echo "</ol>";
    
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='box'>";
    echo "<p class='error'>ERROR: " . $e->getMessage() . "</p>";
    echo "</div>";
}

echo "</body></html>";
