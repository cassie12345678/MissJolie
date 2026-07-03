<?php
/* ============================================================
   BOOKING REMINDERS - VERSTUUR HERINNERINGEN
   Dit script moet periodiek worden uitgevoerd (bijv. via cron)
   Controleert bookings die binnen 24 uur plaatsvinden
============================================================ */

require_once 'db-config.php';
require_once 'email-template.php';

try {
    // Haal bookings op die binnen 24 uur plaatsvinden en nog geen herinnering hebben gekregen
    $stmt = $pdo->prepare("
        SELECT * FROM bookings 
        WHERE status = 'confirmed' 
        AND payment_status = 'paid'
        AND reminder_sent = 0
        AND CONCAT(booking_date, ' ', booking_time) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
        ORDER BY booking_date, booking_time
    ");
    $stmt->execute();
    $upcomingBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $remindersSent = 0;
    
    foreach ($upcomingBookings as $booking) {
        // Bereken tijd tot booking
        $bookingDateTime = new DateTime($booking['booking_date'] . ' ' . $booking['booking_time']);
        $now = new DateTime();
        $interval = $now->diff($bookingDateTime);
        
        $hoursUntil = $interval->h + ($interval->days * 24);
        $minutesUntil = $interval->i;
        
        // Maak vriendelijke tijd string
        if ($hoursUntil >= 1) {
            $timeUntil = $hoursUntil . ' uur';
        } else {
            $timeUntil = $minutesUntil . ' minuten';
        }
        
        // Format datum en tijd voor email
        $bookingDate = $bookingDateTime->format('l j F Y');
        $bookingTime = substr($booking['booking_time'], 0, 5);
        
        // Maak email content
        $emailContent = '
            <h2 style="color: #d896ff;">⏰ Herinnering: Je Sessie Begint Bijna!</h2>
            <p>Hallo ' . htmlspecialchars($booking['customer_name']) . ',</p>
            <p>Dit is een vriendelijke herinnering dat je geboekte sessie over ongeveer <strong style="color: #d896ff;">' . $timeUntil . '</strong> plaatsvindt!</p>
            
            <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #d896ff; margin-top: 0;">📅 Jouw Afspraak Details</h3>
                <p style="margin: 8px 0;"><strong>Service:</strong> ' . htmlspecialchars($booking['service']) . '</p>
                <p style="margin: 8px 0;"><strong>Duur:</strong> ' . htmlspecialchars($booking['duration']) . '</p>
                <p style="margin: 8px 0;"><strong>Datum:</strong> ' . $bookingDate . '</p>
                <p style="margin: 8px 0;"><strong>Tijd:</strong> ' . $bookingTime . '</p>
            </div>
            
            <div class="divider"></div>
            
            <h3 style="color: #d896ff;">✅ Voorbereiden voor je Sessie</h3>
            <ul style="color: #ccc; line-height: 1.8;">
                <li>Zorg dat je een stabiele internetverbinding hebt</li>
                <li>Zoek een rustige en privé plek</li>
                <li>Test je camera en microfoon (voor videocalls)</li>
                <li>Zorg dat je op tijd beschikbaar bent</li>
            </ul>
            
            <div class="divider"></div>
            
            <h3 style="color: #d896ff;">📱 Hoe We Contact Maken</h3>
            <p>Je ontvangt kort voor de sessie een bericht met de exacte details over hoe we in contact komen.</p>
            
            <div class="divider"></div>
            
            <h3 style="color: #d896ff;">❓ Niet kunnen?</h3>
            <p>Kun je niet meer? Laat het dan zo snel mogelijk weten via <a href="mailto:info@miss-jolie.store" style="color: #d896ff;">info@miss-jolie.store</a></p>
            
            <p style="margin-top: 30px;">Tot zo! 💋<br><strong style="color: #d896ff;">Miss Jolie</strong></p>
        ';
        
        // Verstuur email
        if (sendHtmlEmail($booking['customer_email'], "Herinnering: Je Sessie Begint Bijna - Miss Jolie", $emailContent)) {
            // Update booking om aan te geven dat herinnering is verstuurd
            $updateStmt = $pdo->prepare("UPDATE bookings SET reminder_sent = 1, reminder_sent_at = NOW() WHERE id = ?");
            $updateStmt->execute([$booking['id']]);
            
            $remindersSent++;
            
            echo "✓ Herinnering verstuurd naar: " . $booking['customer_email'] . " (Booking #" . $booking['id'] . ")\n";
        } else {
            echo "✗ Fout bij versturen naar: " . $booking['customer_email'] . " (Booking #" . $booking['id'] . ")\n";
        }
    }
    
    echo "\n===========================================\n";
    echo "Totaal herinneringen verstuurd: " . $remindersSent . "\n";
    echo "===========================================\n";
    
    // Log resultaat
    file_put_contents("booking-reminders-log.txt", 
        date("Y-m-d H:i:s") . " | Reminders sent: $remindersSent | Checked: " . count($upcomingBookings) . " bookings\n", 
        FILE_APPEND
    );
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    file_put_contents("booking-reminders-log.txt", 
        date("Y-m-d H:i:s") . " | ERROR: " . $e->getMessage() . "\n", 
        FILE_APPEND
    );
}
