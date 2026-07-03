<?php
/* ============================================================
   RESEND NOTIFICATION EMAIL - ADMIN TOOL
   Send ALL notifications to Miss Jolie for past orders
   Accepts: booking_id, payment_id, or user_id
   Supports: bookings, collections, packages, merchandise, etc
============================================================ */

header('Content-Type: application/json');

require_once 'db-config.php';
require_once 'email-template.php';

$bookingId = isset($_POST['booking_id']) ? intval($_POST['booking_id']) : 0;
$paymentId = isset($_POST['payment_id']) ? $_POST['payment_id'] : '';
$userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
$adminKey = isset($_POST['admin_key']) ? $_POST['admin_key'] : '';

// Security check
$expectedKey = 'admin_resend_notification_key_missjolie_2026';
if ($adminKey !== $expectedKey) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit;
}

if ($bookingId <= 0 && empty($paymentId) && $userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Provide booking_id, payment_id, or user_id']);
    exit;
}

try {
    $allItems = [];
    
    // Get BOOKINGS
    if ($bookingId > 0) {
        $query = "SELECT b.* FROM bookings b WHERE b.id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$bookingId]);
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($bookings as $b) {
            $b['item_type'] = 'booking';
            $allItems[] = $b;
        }
    } elseif (!empty($paymentId)) {
        // Get bookings for this payment
        $query = "SELECT b.* FROM bookings b WHERE b.payment_id = ? ORDER BY b.booking_date DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$paymentId]);
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($bookings as $b) {
            $b['item_type'] = 'booking';
            $allItems[] = $b;
        }
        
        // Get purchases for this payment
        $query = "SELECT p.*, u.email FROM purchases p LEFT JOIN users u ON p.user_id = u.id WHERE p.payment_id = ? ORDER BY p.id DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$paymentId]);
        $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($purchases as $p) {
            $p['item_type'] = 'purchase';
            $allItems[] = $p;
        }
    } elseif ($userId > 0) {
        // Get all bookings for this user
        $query = "SELECT b.* FROM bookings b WHERE b.user_id = ? ORDER BY b.booking_date DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($bookings as $b) {
            $b['item_type'] = 'booking';
            $allItems[] = $b;
        }
        
        // Get all purchases for this user
        $query = "SELECT p.*, u.email FROM purchases p LEFT JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.id DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($purchases as $p) {
            $p['item_type'] = 'purchase';
            $allItems[] = $p;
        }
    }
    
    if (empty($allItems)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'No items found']);
        exit;
    }
    
    // Send notification for each item
    $successCount = 0;
    $failCount = 0;
    $sentItems = [];
    
    foreach ($allItems as $item) {
        $itemType = $item['item_type'];
        
        if ($itemType === 'booking') {
            // Format booking date and time (bookings table has customer info built-in)
            $itemDate = date('l j F Y', strtotime($item['booking_date']));
            $itemTime = substr($item['booking_time'], 0, 5);
            $customerEmail = $item['customer_email'];
            $customerName = $item['customer_name'];
            $productName = $item['service'];
            $productDetails = $item['duration'];
            $customerPhone = $item['customer_phone'] ?? null;
            
            $emailContentMissJolie = '
                <p><strong>🔔 HERINDIENING: BOEKING NOTIFICATIE</strong></p>
                <p style="font-size: 12px; color: #999;">Deze mail werd oorspronkelijk niet verzonden en wordt nu opnieuw gestuurd.</p>
                <div class="divider"></div>
                <p><strong>Klantnaam:</strong> ' . htmlspecialchars($customerName) . '</p>
                <p><strong>E-mail:</strong> <a href="mailto:' . htmlspecialchars($customerEmail) . '" style="color: #d896ff;">' . htmlspecialchars($customerEmail) . '</a></p>
                <p><strong>Telefoon:</strong> ' . (htmlspecialchars($customerPhone) ?: "Niet opgegeven") . '</p>
                <div class="divider"></div>
                <p><strong>Boekingdetails:</strong></p>
                <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 8px 0;"><strong>Service:</strong> ' . htmlspecialchars($productName) . '</p>
                    <p style="margin: 8px 0;"><strong>Duur:</strong> ' . htmlspecialchars($productDetails) . '</p>
                    <p style="margin: 8px 0;"><strong>Datum:</strong> ' . $itemDate . '</p>
                    <p style="margin: 8px 0;"><strong>Tijd:</strong> ' . $itemTime . '</p>
                    <p style="margin: 8px 0;"><strong>Prijs:</strong> €' . number_format(floatval($item['price']), 2, ',', '.') . '</p>
                    <p style="margin: 8px 0;"><strong>Betaling ID:</strong> ' . htmlspecialchars($item['payment_id'] ?: 'N/A') . '</p>
                    <p style="margin: 8px 0;"><strong>Boeking ID:</strong> ' . $item['id'] . '</p>
                </div>
                <p style="margin-top: 30px;">Deze boeking is nu handmatig opnieuw verzonden.<br><strong style="color: #d896ff;">✓ Verwerkt!</strong></p>
            ';
            
            $subject = "🔔 Herindiening: Nieuwe Boeking - " . htmlspecialchars($productName);
            $sentItems[] = [
                'id' => $item['id'],
                'type' => 'Boeking',
                'product' => $productName,
                'customer' => $customerName,
                'price' => $item['price']
            ];
            
        } else {
            // PURCHASE (collection, package, merchandise, strings, etc)
            // For purchases, customer email comes from the users table JOIN
            $customerEmail = $item['email'] ?? 'Onbekend';
            $customerName = $customerEmail; // No name field in users table for purchases
            $productName = $item['item_name'];
            $productType = ucfirst($item['purchase_type']);
            
            $emailContentMissJolie = '
                <p><strong>🔔 HERINDIENING: AANKOOP NOTIFICATIE</strong></p>
                <p style="font-size: 12px; color: #999;">Deze mail werd oorspronkelijk niet verzonden en wordt nu opnieuw gestuurd.</p>
                <div class="divider"></div>
                <p><strong>Type:</strong> ' . htmlspecialchars($productType) . '</p>
                <p><strong>Klantnaam:</strong> ' . htmlspecialchars($customerName) . '</p>
                <p><strong>E-mail:</strong> <a href="mailto:' . htmlspecialchars($customerEmail) . '" style="color: #d896ff;">' . htmlspecialchars($customerEmail) . '</a></p>
                <div class="divider"></div>
                <p><strong>Product Details:</strong></p>
                <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 8px 0;"><strong>Product:</strong> ' . htmlspecialchars($productName) . '</p>
                    <p style="margin: 8px 0;"><strong>Type:</strong> ' . htmlspecialchars($productType) . '</p>
                    <p style="margin: 8px 0;"><strong>Prijs:</strong> €' . number_format(floatval($item['price']), 2, ',', '.') . '</p>
                    <p style="margin: 8px 0;"><strong>Betaling ID:</strong> ' . htmlspecialchars($item['payment_id'] ?: 'N/A') . '</p>
                    <p style="margin: 8px 0;"><strong>Aankoop ID:</strong> ' . $item['id'] . '</p>
                </div>
                <p style="margin-top: 30px;">Deze aankoop is nu handmatig opnieuw verzonden.<br><strong style="color: #d896ff;">✓ Verwerkt!</strong></p>
            ';
            
            $subject = "🔔 Herindiening: " . htmlspecialchars($productType) . " - " . htmlspecialchars($productName);
            $sentItems[] = [
                'id' => $item['id'],
                'type' => $productType,
                'product' => $productName,
                'customer' => $customerName,
                'price' => $item['price']
            ];
        }
        
        // Send email to Miss Jolie
        $emailSent = sendHtmlEmail("info@miss-jolie.store", $subject, $emailContentMissJolie);
        
        if ($emailSent) {
            $successCount++;
        } else {
            $failCount++;
        }
        
        // Log the resend
        $productRef = ($itemType === 'booking') ? $item['service'] : $item['item_name'];
        $logMessage = date("Y-m-d H:i:s") . " | MANUAL RESEND | Type: $itemType | ID: " . $item['id'] . " | Product: " . $productRef . " | Customer: " . $customerEmail . " | Status: " . ($emailSent ? "SUCCESS" : "FAILED") . "\n";
        file_put_contents(__DIR__ . "/mollie-log.txt", $logMessage, FILE_APPEND);
    }
    
    if ($successCount > 0) {
        echo json_encode([
            'success' => true,
            'message' => "✅ $successCount notificatie(s) verzonden naar info@miss-jolie.store",
            'success_count' => $successCount,
            'fail_count' => $failCount,
            'items' => $sentItems
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => "Alle $failCount email(s) failed. Check server mail configuration."
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    file_put_contents(__DIR__ . "/mollie-log.txt", 
        date("Y-m-d H:i:s") . " | RESEND ERROR: " . $e->getMessage() . "\n",
        FILE_APPEND
    );
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

