<?php
/* ============================================================
   SAVE PURCHASE ENDPOINT
   POST: purchase_type, item_id, item_name, price, payment_id
============================================================ */

header('Content-Type: application/json');
require_once 'db-config.php';

function columnExists(PDO $pdo, string $tableName, string $columnName): bool {
    try {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM `{$tableName}` LIKE ?");
        $stmt->execute([$columnName]);
        return (bool) $stmt->fetchColumn();
    } catch (Throwable $e) {
        return false;
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Alleen POST verzoeken toegestaan']));
}

// Check of user is ingelogd
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Niet ingelogd']));
}

$data = json_decode(file_get_contents('php://input'), true);
$userId = $_SESSION['user_id'];
$purchaseType = isset($data['purchase_type']) ? $data['purchase_type'] : '';
$itemId = isset($data['item_id']) ? $data['item_id'] : '';
$itemName = isset($data['item_name']) ? $data['item_name'] : '';
$price = isset($data['price']) ? floatval($data['price']) : 0;
$paymentId = isset($data['payment_id']) ? $data['payment_id'] : null;

// Validatie
if (empty($purchaseType) || empty($itemId) || empty($itemName) || $price <= 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Ongeldige purchase data']));
}

try {
    $inserted = false;

    // Preferred path: payment_id + payment_status in one insert.
    try {
        $stmt = $pdo->prepare(" 
            INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price, payment_id, payment_status) 
            VALUES (?, ?, ?, ?, ?, ?, 'paid')
        ");
        $stmt->execute([$userId, $purchaseType, $itemId, $itemName, $price, $paymentId]);
        $inserted = true;
    } catch (Throwable $e) {
        // Fallback for schemas missing one of the columns.
    }

    if (!$inserted) {
        try {
            $stmt = $pdo->prepare(" 
                INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price, payment_id) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$userId, $purchaseType, $itemId, $itemName, $price, $paymentId]);
            $inserted = true;
        } catch (Throwable $e) {
            // Continue fallback chain.
        }
    }

    if (!$inserted) {
        try {
            $stmt = $pdo->prepare(" 
                INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price, payment_status) 
                VALUES (?, ?, ?, ?, ?, 'paid')
            ");
            $stmt->execute([$userId, $purchaseType, $itemId, $itemName, $price]);
            $inserted = true;
        } catch (Throwable $e) {
            // Continue fallback chain.
        }
    }

    if (!$inserted) {
        $stmt = $pdo->prepare(" 
            INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $purchaseType, $itemId, $itemName, $price]);
    }

    // Force paid status when column exists but couldn't be used in insert.
    try {
        $lastId = intval($pdo->lastInsertId());
        if ($lastId > 0) {
            $upd = $pdo->prepare("UPDATE purchases SET payment_status = 'paid' WHERE id = ?");
            $upd->execute([$lastId]);
        }
    } catch (Throwable $e) {
        // Ignore for schemas without payment_status.
    }
    
    // Als het een collection is, voeg ook toe aan user_collections
    if ($purchaseType === 'collection') {
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO user_collections (user_id, collection_id) 
            VALUES (?, ?)
        ");
        $stmt->execute([$userId, $itemId]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Purchase opgeslagen'
    ]);
    
} catch (PDOException $e) {
    error_log("Save purchase error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Er ging iets fout bij het opslaan']);
}
