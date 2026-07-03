<?php
/* ============================================================
   TEST PAYMENT HANDLER - Direct betaling zonder Mollie
   Simuleert een volledige Mollie webhook voor testen
============================================================ */

header('Content-Type: application/json');

require_once 'db-config.php';
require_once 'email-template.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Ongeldige request']);
    exit;
}

$customerName = $input['customer_name'] ?? '';
$customerEmail = $input['customer_email'] ?? '';
$customerPhone = $input['customer_phone'] ?? '';
$totalAmount = floatval($input['amount'] ?? 0);
$items = $input['items'] ?? [];

if (!$customerName || !$customerEmail || $totalAmount <= 0 || empty($items)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Alle velden zijn verplicht']);
    exit;
}

try {
    // Genereer random payment ID
    $paymentId = 'test_' . bin2hex(random_bytes(12));
    
    $pdo->beginTransaction();
    
    // Zorg dat gebruiker bestaat
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$customerEmail]);
    $user = $stmt->fetch();
    
    if (!$user) {
        $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, 0)");
        $randomPassword = bin2hex(random_bytes(16));
        $stmt->execute([$customerEmail, password_hash($randomPassword, PASSWORD_BCRYPT)]);
        $userId = $pdo->lastInsertId();
    } else {
        $userId = intval($user['id']);
    }
    
    $processedItems = [];
    
    // Verwerk elk item
    foreach ($items as $item) {
        $itemType = $item['type'] ?? '';
        
        if ($itemType === 'booking') {
            // Maak boeking aan
            $stmt = $pdo->prepare("
                INSERT INTO bookings 
                (user_id, service, duration, price, booking_date, booking_time, 
                 customer_name, customer_email, customer_phone, payment_id, payment_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid')
            ");
            
            $stmt->execute([
                $userId,
                $item['service'] ?? '',
                $item['duration'] ?? '',
                floatval($item['price'] ?? 0),
                $item['date'] ?? date('Y-m-d'),
                $item['time'] ?? '00:00:00',
                $customerName,
                $customerEmail,
                $customerPhone ?? null,
                $paymentId
            ]);
            
            $bookingId = $pdo->lastInsertId();
            
            $processedItems[] = [
                'type' => 'booking',
                'id' => $bookingId,
                'service' => $item['service'] ?? '',
                'duration' => $item['duration'] ?? '',
                'price' => floatval($item['price'] ?? 0),
                'customer_name' => $customerName,
                'customer_email' => $customerEmail,
                'customer_phone' => $customerPhone,
                'booking_date' => $item['date'] ?? date('Y-m-d'),
                'booking_time' => $item['time'] ?? '00:00:00'
            ];
            
        } elseif ($itemType === 'purchase') {
            // Maak aankoop aan
            $stmt = $pdo->prepare("
                INSERT INTO purchases 
                (user_id, purchase_type, item_name, price, payment_id, payment_status)
                VALUES (?, ?, ?, ?, ?, 'paid')
            ");
            
            $stmt->execute([
                $userId,
                $item['purchase_type'] ?? 'merchandise',
                $item['item_name'] ?? '',
                floatval($item['price'] ?? 0),
                $paymentId
            ]);
            
            $purchaseId = $pdo->lastInsertId();
            
            $processedItems[] = [
                'type' => 'purchase',
                'id' => $purchaseId,
                'purchase_type' => $item['purchase_type'] ?? 'merchandise',
                'item_name' => $item['item_name'] ?? '',
                'price' => floatval($item['price'] ?? 0),
                'user_id' => $userId
            ];
        }
    }
    
    $pdo->commit();
    
    // Verzend emails naar klant en Miss Jolie
    $successCount = 0;
    $failCount = 0;
    
    foreach ($processedItems as $item) {
        if ($item['type'] === 'booking') {
            // Booking confirmation email naar klant
            $bookingDate = date('l j F Y', strtotime($item['booking_date']));
            $bookingTime = substr($item['booking_time'], 0, 5);
            
            $emailContent = '
                <p><strong>✅ Boeking Bevestigd!</strong></p>
                <div class="divider"></div>
                <p><strong>Boekingdetails:</strong></p>
                <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 8px 0;"><strong>Service:</strong> ' . htmlspecialchars($item['service']) . '</p>
                    <p style="margin: 8px 0;"><strong>Duur:</strong> ' . htmlspecialchars($item['duration']) . '</p>
                    <p style="margin: 8px 0;"><strong>Datum:</strong> ' . $bookingDate . '</p>
                    <p style="margin: 8px 0;"><strong>Tijd:</strong> ' . $bookingTime . '</p>
                    <p style="margin: 8px 0;"><strong>Prijs:</strong> €' . number_format($item['price'], 2, ',', '.') . '</p>
                </div>
                <p>Bedankt voor je boeking! Miss Jolie zal contact met je opnemen.</p>
            ';
            
            if (sendHtmlEmail($item['customer_email'], "✅ Boeking Bevestigd - Miss Jolie", $emailContent)) {
                $successCount++;
            } else {
                $failCount++;
            }
            
            // Notification email naar Miss Jolie
            $missJolieContent = '
                <p><strong>🔔 NIEUWE BOEKING ONTVANGEN</strong></p>
                <div class="divider"></div>
                <p><strong>Klantnaam:</strong> ' . htmlspecialchars($item['customer_name']) . '</p>
                <p><strong>E-mail:</strong> <a href="mailto:' . htmlspecialchars($item['customer_email']) . '" style="color: #d896ff;">' . htmlspecialchars($item['customer_email']) . '</a></p>
                <p><strong>Telefoon:</strong> ' . (htmlspecialchars($item['customer_phone']) ?: "Niet opgegeven") . '</p>
                <div class="divider"></div>
                <p><strong>Boekingdetails:</strong></p>
                <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 8px 0;"><strong>Service:</strong> ' . htmlspecialchars($item['service']) . '</p>
                    <p style="margin: 8px 0;"><strong>Duur:</strong> ' . htmlspecialchars($item['duration']) . '</p>
                    <p style="margin: 8px 0;"><strong>Datum:</strong> ' . $bookingDate . '</p>
                    <p style="margin: 8px 0;"><strong>Tijd:</strong> ' . $bookingTime . '</p>
                    <p style="margin: 8px 0;"><strong>Prijs:</strong> €' . number_format($item['price'], 2, ',', '.') . '</p>
                </div>
            ';
            
            if (sendHtmlEmail("info@miss-jolie.store", "🔔 NIEUWE BOEKING - " . htmlspecialchars($item['service']), $missJolieContent)) {
                $successCount++;
            } else {
                $failCount++;
            }
            
        } else {
            // Purchase notification naar Miss Jolie
            $purchaseType = ucfirst($item['purchase_type']);
            
            $missJolieContent = '
                <p><strong>🆕 NIEUWE AANKOOP ONTVANGEN</strong></p>
                <div class="divider"></div>
                <p><strong>Type:</strong> ' . htmlspecialchars($purchaseType) . '</p>
                <p><strong>Product:</strong> ' . htmlspecialchars($item['item_name']) . '</p>
                <p><strong>Prijs:</strong> €' . number_format($item['price'], 2, ',', '.') . '</p>
                <div class="divider"></div>
                <p><strong>Klantgegevens via User ID:</strong> ' . $item['user_id'] . '</p>
            ';
            
            if (sendHtmlEmail("info@miss-jolie.store", "🆕 NIEUWE AANKOOP - " . htmlspecialchars($purchaseType), $missJolieContent)) {
                $successCount++;
            } else {
                $failCount++;
            }
        }
    }
    
    // Log alles naar mollie-log.txt
    $logMessage = date("Y-m-d H:i:s") . " | TEST PAYMENT | Payment ID: $paymentId | Items: " . count($processedItems) . " | Customer: $customerEmail | Emails Sent: $successCount | Status: SUCCESS\n";
    file_put_contents(__DIR__ . "/mollie-log.txt", $logMessage, FILE_APPEND);
    
    echo json_encode([
        'success' => true,
        'message' => '✅ Testbetaling succesvol verwerkt! ' . count($processedItems) . ' item(s) opgeslagen, ' . $successCount . ' email(s) verzonden.',
        'details' => [
            'payment_id' => $paymentId,
            'items_count' => count($processedItems),
            'emails_sent' => $successCount,
            'user_id' => $userId
        ]
    ]);
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    file_put_contents(__DIR__ . "/mollie-log.txt",
        date("Y-m-d H:i:s") . " | TEST PAYMENT ERROR: " . $e->getMessage() . "\n",
        FILE_APPEND
    );
    
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database fout: ' . $e->getMessage()]);
}
?>
