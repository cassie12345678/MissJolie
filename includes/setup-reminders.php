<?php
/* ============================================================
   AUTO-SETUP DATABASE VOOR BOOKING REMINDERS
   Dit script controleert en voegt automatisch reminder kolommen toe
============================================================ */

require_once 'db-config.php';

echo "<h2>Booking Reminders Database Setup</h2>";
echo "<hr>";

try {
    // Check of reminder_sent kolom al bestaat
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'reminder_sent'");
    $reminderSentExists = $stmt->rowCount() > 0;
    
    if ($reminderSentExists) {
        echo "<p style='color: orange;'>⚠️ Reminder kolommen bestaan al!</p>";
        echo "<p>De database is al correct ingesteld voor reminders.</p>";
    } else {
        echo "<p style='color: blue;'>➡️ Reminder kolommen niet gevonden, toevoegen...</p>";
        
        // Voeg reminder_sent kolom toe
        $pdo->exec("ALTER TABLE bookings ADD COLUMN reminder_sent TINYINT(1) DEFAULT 0 AFTER payment_status");
        echo "<p style='color: green;'>✓ Kolom 'reminder_sent' toegevoegd</p>";
        
        // Voeg reminder_sent_at kolom toe
        $pdo->exec("ALTER TABLE bookings ADD COLUMN reminder_sent_at DATETIME NULL AFTER reminder_sent");
        echo "<p style='color: green;'>✓ Kolom 'reminder_sent_at' toegevoegd</p>";
        
        // Voeg index toe
        $pdo->exec("ALTER TABLE bookings ADD INDEX idx_reminder_sent (reminder_sent, booking_date, booking_time)");
        echo "<p style='color: green;'>✓ Index 'idx_reminder_sent' toegevoegd</p>";
        
        echo "<hr>";
        echo "<h3 style='color: green;'>✅ Database Setup Voltooid!</h3>";
        echo "<p>De bookings tabel is nu klaar voor reminders.</p>";
    }
    
    // Toon huidige tabel structuur
    echo "<hr>";
    echo "<h3>Huidige Bookings Tabel Structuur:</h3>";
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse; margin-top: 10px;'>";
    echo "<tr style='background: #333; color: white;'><th>Kolom</th><th>Type</th><th>Null</th><th>Default</th></tr>";
    
    $stmt = $pdo->query("DESCRIBE bookings");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $highlight = ($row['Field'] === 'reminder_sent' || $row['Field'] === 'reminder_sent_at') ? 
            "style='background: #d4edda;'" : "";
        echo "<tr $highlight>";
        echo "<td><strong>" . htmlspecialchars($row['Field']) . "</strong></td>";
        echo "<td>" . htmlspecialchars($row['Type']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Null']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Default'] ?? 'NULL') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Toon aantal bookings
    echo "<hr>";
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM bookings");
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    echo "<h3>Bookings in Database:</h3>";
    echo "<p>Totaal aantal bookings: <strong>$count</strong></p>";
    
    if ($count > 0) {
        echo "<h4>Laatste 5 Bookings:</h4>";
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse; margin-top: 10px;'>";
        echo "<tr style='background: #333; color: white;'>";
        echo "<th>ID</th><th>Service</th><th>Datum</th><th>Tijd</th><th>Klant</th><th>Status</th><th>Betaling</th><th>Reminder</th>";
        echo "</tr>";
        
        $stmt = $pdo->query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($row['id']) . "</td>";
            echo "<td>" . htmlspecialchars($row['service']) . "</td>";
            echo "<td>" . htmlspecialchars($row['booking_date']) . "</td>";
            echo "<td>" . htmlspecialchars($row['booking_time']) . "</td>";
            echo "<td>" . htmlspecialchars($row['customer_name']) . "</td>";
            echo "<td>" . htmlspecialchars($row['status']) . "</td>";
            echo "<td>" . htmlspecialchars($row['payment_status']) . "</td>";
            echo "<td>" . ($row['reminder_sent'] ?? 0 ? '✓ Ja' : '✗ Nee') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    echo "<hr>";
    echo "<h3>Volgende Stappen:</h3>";
    echo "<ol>";
    echo "<li>✅ Database is klaar voor reminders</li>";
    echo "<li>Test reminder script: <code>php includes/send-booking-reminders.php</code></li>";
    echo "<li>Setup cron job (zie BOOKING-REMINDERS-SETUP.md)</li>";
    echo "</ol>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'><strong>❌ Database Error:</strong></p>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
    echo "<hr>";
    echo "<h3>Handmatig Setup:</h3>";
    echo "<p>Voer deze SQL uit in phpMyAdmin:</p>";
    echo "<pre style='background: #f4f4f4; padding: 15px; border-radius: 5px;'>";
    echo "ALTER TABLE bookings \n";
    echo "ADD COLUMN reminder_sent TINYINT(1) DEFAULT 0 AFTER payment_status,\n";
    echo "ADD COLUMN reminder_sent_at DATETIME NULL AFTER reminder_sent,\n";
    echo "ADD INDEX idx_reminder_sent (reminder_sent, booking_date, booking_time);";
    echo "</pre>";
}
