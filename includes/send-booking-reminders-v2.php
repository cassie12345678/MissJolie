<?php
/* ============================================================
   TWO-STAGE BOOKING REMINDERS
   - 1 uur voor sessie: Herinnering
   - 5 minuten voor sessie: Instructies + Video call link
   
   Dit script moet vaak draaien (bijv. elke 5-10 minuten via cron)
============================================================ */

require_once 'db-config.php';
require_once 'email-template.php';

// Functie om unieke video call link te genereren
function generateVideoCallLink($bookingId) {
    // Genereer een unieke token voor de video call
    $token = bin2hex(random_bytes(16));
    
    // In deze versie gebruiken we een simpele link structuur
    // Je kunt dit aanpassen naar je eigen video platform (Whereby, Jitsi, etc.)
    $baseUrl = "https://miss-jolie.store/video-call.php";
    return $baseUrl . "?session=" . $token . "&booking=" . $bookingId;
}

try {
    $now = new DateTime();
    $remindersSent = 0;
    
    // ===================================================================
    // FASE 1: VERSTUUR 1-UUR HERINNERING
    // ===================================================================
    
    // Bereken tijdvenster: tussen 55 en 65 minuten voor de sessie
    $stmt = $pdo->prepare("
        SELECT * FROM bookings 
        WHERE status = 'confirmed' 
        AND payment_status = 'paid'
        AND reminder_1h_sent = 0
        AND TIMESTAMPDIFF(MINUTE, NOW(), CONCAT(booking_date, ' ', booking_time)) BETWEEN 55 AND 65
        ORDER BY booking_date, booking_time
    ");
    $stmt->execute();
    $bookingsFor1h = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($bookingsFor1h as $booking) {
        $bookingDateTime = new DateTime($booking['booking_date'] . ' ' . $booking['booking_time']);
        $bookingDate = $bookingDateTime->format('l j F Y');
        $bookingTime = substr($booking['booking_time'], 0, 5);
        
        // Email content voor 1-uur herinnering
        $emailContent = '
            <h2 style="color: #d896ff;">⏰ Herinnering: Je Sessie Begint Over 1 Uur!</h2>
            <p>Hallo ' . htmlspecialchars($booking['customer_name']) . ',</p>
            <p>Dit is een vriendelijke herinnering dat je geboekte sessie over ongeveer <strong style="color: #d896ff;">1 uur</strong> plaatsvindt!</p>
            
            <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #d896ff; margin-top: 0;">📅 Jouw Afspraak Details</h3>
                <p style="margin: 8px 0;"><strong>Service:</strong> ' . htmlspecialchars($booking['service']) . '</p>
                <p style="margin: 8px 0;"><strong>Duur:</strong> ' . htmlspecialchars($booking['duration']) . '</p>
                <p style="margin: 8px 0;"><strong>Datum:</strong> ' . $bookingDate . '</p>
                <p style="margin: 8px 0;"><strong>Tijd:</strong> ' . $bookingTime . '</p>
            </div>
            
            <div class="divider"></div>
            
            <h3 style="color: #d896ff;">✅ Bereid Je Voor</h3>
            <ul style="color: #ccc; line-height: 1.8;">
                <li>Zorg dat je een stabiele internetverbinding hebt</li>
                <li>Zoek een rustige en privé plek</li>
                <li>Test je camera en microfoon (voor videocalls)</li>
                <li>Zorg dat je apparaat is opgeladen</li>
            </ul>
            
            <div style="background: rgba(216, 150, 255, 0.15); padding: 15px; border-left: 4px solid #d896ff; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #d896ff;"><strong>💡 TIP:</strong> Je ontvangt 5 minuten voor de sessie nog een email met de exacte instructies en de link om deel te nemen!</p>
            </div>
            
            <div class="divider"></div>
            
            <h3 style="color: #d896ff;">❓ Niet kunnen?</h3>
            <p>Kun je niet meer? Laat het dan zo snel mogelijk weten via <a href="mailto:info@miss-jolie.store" style="color: #d896ff;">info@miss-jolie.store</a></p>
            
            <p style="margin-top: 30px;">Tot zo! 💋<br><strong style="color: #d896ff;">Miss Jolie</strong></p>
        ';
        
        if (sendHtmlEmail($booking['customer_email'], "⏰ Over 1 uur: Je Sessie bij Miss Jolie", $emailContent)) {
            $updateStmt = $pdo->prepare("UPDATE bookings SET reminder_1h_sent = 1, reminder_1h_sent_at = NOW() WHERE id = ?");
            $updateStmt->execute([$booking['id']]);
            $remindersSent++;
            echo "✓ 1-uur herinnering verstuurd naar: " . $booking['customer_email'] . " (Booking #" . $booking['id'] . ")\n";
        } else {
            echo "✗ Fout bij 1-uur herinnering naar: " . $booking['customer_email'] . " (Booking #" . $booking['id'] . ")\n";
        }
    }
    
    // ===================================================================
    // FASE 2: VERSTUUR 5-MINUTEN INSTRUCTIE + VIDEO LINK
    // ===================================================================
    
    // Bereken tijdvenster: tussen 3 en 7 minuten voor de sessie
    $stmt = $pdo->prepare("
        SELECT * FROM bookings 
        WHERE status = 'confirmed' 
        AND payment_status = 'paid'
        AND reminder_5m_sent = 0
        AND TIMESTAMPDIFF(MINUTE, NOW(), CONCAT(booking_date, ' ', booking_time)) BETWEEN 3 AND 7
        ORDER BY booking_date, booking_time
    ");
    $stmt->execute();
    $bookingsFor5m = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($bookingsFor5m as $booking) {
        $bookingDateTime = new DateTime($booking['booking_date'] . ' ' . $booking['booking_time']);
        $bookingTime = substr($booking['booking_time'], 0, 5);
        
        // Genereer video call link als deze nog niet bestaat
        $videoLink = $booking['video_call_link'];
        if (empty($videoLink)) {
            $videoLink = generateVideoCallLink($booking['id']);
            // Sla de link op in de database
            $saveLinkStmt = $pdo->prepare("UPDATE bookings SET video_call_link = ? WHERE id = ?");
            $saveLinkStmt->execute([$videoLink, $booking['id']]);
        }
        
        // Email content voor 5-minuten instructies
        $emailContent = '
            <h2 style="color: #d896ff;">🎥 Je Sessie Begint NU - Laatste Instructies!</h2>
            <p>Hallo ' . htmlspecialchars($booking['customer_name']) . ',</p>
            <p>Je sessie begint over <strong style="color: #d896ff;">5 minuten</strong> om <strong>' . $bookingTime . '</strong>!</p>
            
            <div style="background: linear-gradient(135deg, #d896ff 0%, #9b4dca 100%); padding: 25px; border-radius: 15px; margin: 25px 0; text-align: center;">
                <h3 style="color: white; margin-top: 0; font-size: 24px;">📞 Klik Hier Om Deel Te Nemen</h3>
                <a href="' . htmlspecialchars($videoLink) . '" 
                   style="display: inline-block; background: white; color: #9b4dca; padding: 15px 40px; 
                          text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 18px;
                          margin: 10px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                    🎥 START VIDEOCALL
                </a>
                <p style="color: white; margin-bottom: 0; font-size: 14px;">
                    Of kopieer deze link: <br>
                    <span style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 5px; 
                                 display: inline-block; margin-top: 5px; word-break: break-all;">
                        ' . htmlspecialchars($videoLink) . '
                    </span>
                </p>
            </div>
            
            <div class="divider"></div>
            
            <h3 style="color: #d896ff;">📋 Wat Kun Je Verwachten?</h3>
            <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 15px 0;">
                <ul style="color: #ccc; line-height: 1.8; margin: 0;">
                    <li><strong>Bellen:</strong> Je wordt gebeld via de video call link hierboven</li>
                    <li><strong>Camera:</strong> Zorg dat je camera en microfoon werken</li>
                    <li><strong>Privacy:</strong> Ga naar een rustige, privé plek</li>
                    <li><strong>Verbinding:</strong> Check je internetverbinding</li>
                    <li><strong>Duur:</strong> De sessie duurt ' . htmlspecialchars($booking['duration']) . '</li>
                </ul>
            </div>
            
            <div class="divider"></div>
            
            <h3 style="color: #d896ff;">⚙️ Technische Tips</h3>
            <ul style="color: #ccc; line-height: 1.8;">
                <li>Gebruik bij voorkeur Chrome, Firefox of Safari</li>
                <li>Geef toestemming voor camera en microfoon wanneer gevraagd</li>
                <li>Bij problemen: ververs de pagina of probeer een andere browser</li>
                <li>Zorg dat je headset/oordopjes werkt voor de beste ervaring</li>
            </ul>
            
            <div style="background: rgba(216, 150, 255, 0.15); padding: 15px; border-left: 4px solid #d896ff; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #d896ff;"><strong>⏰ BELANGRIJK:</strong> Wees op tijd! De sessie start exact om ' . $bookingTime . '. Klik nu al op de link om je voor te bereiden.</p>
            </div>
            
            <div class="divider"></div>
            
            <h3 style="color: #d896ff;">📞 Hulp Nodig?</h3>
            <p>Technische problemen? Stuur direct een bericht naar <a href="mailto:info@miss-jolie.store" style="color: #d896ff;">info@miss-jolie.store</a></p>
            
            <p style="margin-top: 30px;">Ik zie je zo! 💋<br><strong style="color: #d896ff;">Miss Jolie</strong></p>
        ';
        
        if (sendHtmlEmail($booking['customer_email'], "🎥 Je Sessie Begint NU! - Klik Om Deel Te Nemen", $emailContent)) {
            $updateStmt = $pdo->prepare("UPDATE bookings SET reminder_5m_sent = 1, reminder_5m_sent_at = NOW() WHERE id = ?");
            $updateStmt->execute([$booking['id']]);
            $remindersSent++;
            echo "✓ 5-minuten instructie verstuurd naar: " . $booking['customer_email'] . " (Booking #" . $booking['id'] . ")\n";
        } else {
            echo "✗ Fout bij 5-minuten instructie naar: " . $booking['customer_email'] . " (Booking #" . $booking['id'] . ")\n";
        }
    }
    
    // ===================================================================
    // SAMENVATTING
    // ===================================================================
    
    echo "\n===========================================\n";
    echo "Two-Stage Reminder Check Completed\n";
    echo "===========================================\n";
    echo "1-uur herinneringen: " . count($bookingsFor1h) . " verstuurd\n";
    echo "5-min instructies: " . count($bookingsFor5m) . " verstuurd\n";
    echo "Totaal emails verstuurd: " . $remindersSent . "\n";
    echo "===========================================\n";
    
    // Log resultaat
    file_put_contents("booking-reminders-log.txt", 
        date("Y-m-d H:i:s") . " | Total: $remindersSent | 1h: " . count($bookingsFor1h) . " | 5m: " . count($bookingsFor5m) . "\n", 
        FILE_APPEND
    );
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    file_put_contents("booking-reminders-log.txt", 
        date("Y-m-d H:i:s") . " | ERROR: " . $e->getMessage() . "\n", 
        FILE_APPEND
    );
}
