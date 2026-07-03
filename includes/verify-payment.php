<?php
/* ============================================================
   VERIFY PAYMENT & SAVE PURCHASE - FALLBACK ALS WEBHOOK FAALT
   POST: payment_id
============================================================ */

header('Content-Type: application/json');
require_once 'db-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Alleen POST verzoeken toegestaan']));
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Niet ingelogd']));
}

$data = json_decode(file_get_contents('php://input'), true);
$paymentId = isset($data['payment_id']) ? trim($data['payment_id']) : '';

if (empty($paymentId)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Geen payment_id opgegeven']));
}

$sessionUserId = intval($_SESSION['user_id']);
$apiKey = "live_KT2n6pBqcEwWjUdbEc9dEGxnxK26KB";

// Haal betaling op via Mollie API
$ch = curl_init("https://api.mollie.com/v2/payments/" . $paymentId);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $apiKey,
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || !empty($curlError)) {
    file_put_contents("mollie-log.txt",
        date("Y-m-d H:i:s") . " | verify-payment | curl error: $curlError\n",
        FILE_APPEND
    );
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Kon betaling niet verifiëren']));
}

$payment = json_decode($response, true);
$paymentStatus = strtolower($payment['status'] ?? '');

if ($paymentStatus !== 'paid') {
    die(json_encode([
        'success' => false,
        'alreadySaved' => false,
        'message' => 'Betaling nog niet voltooid (status: ' . $paymentStatus . ')'
    ]));
}

// Controleer of user_id in metadata overeenkomt met de ingelogde gebruiker
$metadata = $payment['metadata'] ?? [];
$metaUserId = isset($metadata['user_id']) ? intval($metadata['user_id']) : 0;

if ($metaUserId > 0 && $metaUserId !== $sessionUserId) {
    file_put_contents("mollie-log.txt",
        date("Y-m-d H:i:s") . " | verify-payment | $paymentId | user mismatch: meta=$metaUserId session=$sessionUserId\n",
        FILE_APPEND
    );
    http_response_code(403);
    die(json_encode(['success' => false, 'message' => 'Betaling hoort niet bij dit account']));
}

// Controleer of deze betaling al is opgeslagen
try {
    $checkStmt = $pdo->prepare("SELECT id FROM purchases WHERE payment_id = ? LIMIT 1");
    $checkStmt->execute([$paymentId]);
    if ($checkStmt->fetch()) {
        die(json_encode(['success' => true, 'alreadySaved' => true, 'message' => 'Aankoop al opgeslagen']));
    }
} catch (Throwable $e) {
    // Tabel heeft mogelijk geen payment_id kolom, ga door.
}

// Haal items op uit metadata
$rawItems = $metadata['items'] ?? [];
$items = is_string($rawItems) ? json_decode($rawItems, true) : (is_array($rawItems) ? $rawItems : []);

if (empty($items) || !is_array($items)) {
    die(json_encode(['success' => false, 'message' => 'Geen items gevonden in betaling']));
}

$savedCount = 0;

foreach ($items as $item) {
    if (!is_array($item)) {
        continue;
    }

    $itemType = $item['type'] ?? null;
    $itemId = $item['id'] ?? null;
    $itemName = $item['name'] ?? 'Onbekend item';
    $itemPrice = isset($item['price']) ? floatval($item['price']) : 0;

    if (!empty($item['tier'])) {
        $itemName .= ' - ' . $item['tier'];
    }
    if (!empty($item['description']) && stripos($itemName, $item['description']) === false) {
        $itemName .= ' - ' . $item['description'];
    }

    if (empty($itemId) && !empty($itemName)) {
        $itemId = $itemName;
    }

    if (empty($itemType) || empty($itemId)) {
        continue;
    }

    $inserted = false;

    try {
        $stmt = $pdo->prepare("
            INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price, payment_id, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, 'paid')
        ");
        $stmt->execute([$sessionUserId, $itemType, $itemId, $itemName, $itemPrice, $paymentId]);
        $inserted = true;
    } catch (Throwable $e) {
        // Fallback.
    }

    if (!$inserted) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price, payment_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$sessionUserId, $itemType, $itemId, $itemName, $itemPrice, $paymentId]);
            $inserted = true;
        } catch (Throwable $e) {
            // Fallback.
        }
    }

    if (!$inserted) {
        $stmt = $pdo->prepare("
            INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$sessionUserId, $itemType, $itemId, $itemName, $itemPrice]);
    }

    try {
        $lastId = intval($pdo->lastInsertId());
        if ($lastId > 0) {
            $upd = $pdo->prepare("UPDATE purchases SET payment_status = 'paid' WHERE id = ?");
            $upd->execute([$lastId]);
        }
    } catch (Throwable $e) {
        // Geen payment_status kolom.
    }

    if ($itemType === 'collection') {
        try {
            $stmt = $pdo->prepare("INSERT IGNORE INTO user_collections (user_id, collection_id) VALUES (?, ?)");
            $stmt->execute([$sessionUserId, $itemId]);
        } catch (Throwable $e) {
            // Ignore.
        }
    }

    $savedCount++;
}

file_put_contents("mollie-log.txt",
    date("Y-m-d H:i:s") . " | verify-payment FALLBACK | $paymentId | User $sessionUserId | $savedCount items saved\n",
    FILE_APPEND
);

echo json_encode([
    'success' => true,
    'alreadySaved' => false,
    'savedCount' => $savedCount,
    'message' => "$savedCount aankoop/aankopen opgeslagen"
]);
