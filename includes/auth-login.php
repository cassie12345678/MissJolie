<?php
/* ============================================================
   LOGIN ENDPOINT
   POST: email, password
============================================================ */

header('Content-Type: application/json');
require_once 'db-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Alleen POST verzoeken toegestaan']));
}

$data = json_decode(file_get_contents('php://input'), true);
$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';

// Validatie
if (empty($email) || empty($password)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Email en wachtwoord zijn verplicht']));
}

try {
    // Haal user op
    $stmt = $pdo->prepare("SELECT id, email, password_hash FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Ongeldig email adres of wachtwoord']));
    }
    
    // Update last login
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Maak sessie
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    
    // Haal purchases op (met fallback queries voor verschillende database schemas)
    $purchases = [];
    $purchaseQueryVariants = [
        "SELECT purchase_type, item_id, item_name, price, payment_id, purchased_at
         FROM purchases
         WHERE user_id = ? AND (payment_status = 'paid' OR payment_status = 'open' OR payment_status IS NULL OR payment_status = '')
         ORDER BY purchased_at DESC",
        "SELECT purchase_type, item_id, item_name, price, payment_id, created_at AS purchased_at
         FROM purchases
         WHERE user_id = ? AND (payment_status = 'paid' OR payment_status = 'open' OR payment_status IS NULL OR payment_status = '')
         ORDER BY created_at DESC",
        "SELECT purchase_type, item_id, item_name, price, payment_id, NULL AS purchased_at
         FROM purchases
         WHERE user_id = ? AND (payment_status = 'paid' OR payment_status = 'open' OR payment_status IS NULL OR payment_status = '')
         ORDER BY id DESC",
        "SELECT purchase_type, item_id, item_name, price, NULL AS payment_id, purchased_at
         FROM purchases
         WHERE user_id = ?
         ORDER BY purchased_at DESC",
        "SELECT purchase_type, item_id, item_name, price, NULL AS payment_id, created_at AS purchased_at
         FROM purchases
         WHERE user_id = ?
         ORDER BY created_at DESC",
        "SELECT purchase_type, item_id, item_name, price, NULL AS payment_id, NULL AS purchased_at
         FROM purchases
         WHERE user_id = ?
         ORDER BY id DESC"
    ];
    foreach ($purchaseQueryVariants as $sql) {
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user['id']]);
            $purchases = $stmt->fetchAll();
            break;
        } catch (Throwable $e) {
            // Probeer volgende variant.
        }
    }

    // Haal collections op
    $collections = [];
    $collectionQueryVariants = [
        "SELECT collection_id, purchased_at FROM user_collections WHERE user_id = ?",
        "SELECT collection_id, created_at AS purchased_at FROM user_collections WHERE user_id = ?",
        "SELECT collection_id, NULL AS purchased_at FROM user_collections WHERE user_id = ?"
    ];
    foreach ($collectionQueryVariants as $sql) {
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user['id']]);
            $collections = $stmt->fetchAll();
            break;
        } catch (Throwable $e) {
            // Probeer volgende variant.
        }
    }

    // Voeg tier toe aan elke aankoop (zelfde logica als auth-check.php)
    foreach ($purchases as &$purchase) {
        $itemName = $purchase['item_name'] ?? '';
        $itemId = $purchase['item_id'] ?? '';
        $extractedTier = null;

        if (!empty($itemId) && !empty($itemName) && strlen($itemName) > strlen($itemId)) {
            $suffix = substr($itemName, strlen($itemId));
            if (preg_match('/^\s*-\s*(\S+)/', $suffix, $m)) {
                $extractedTier = strtolower(trim($m[1]));
            }
        }

        if (empty($extractedTier) && !empty($itemName)) {
            if (preg_match('/ - (\S+)/', $itemName, $m)) {
                $extractedTier = strtolower(trim($m[1]));
            }
        }

        if (!empty($extractedTier)) {
            $purchase['tier'] = $extractedTier;
        }
    }
    unset($purchase);

    echo json_encode([
        'success' => true,
        'message' => 'Succesvol ingelogd',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'purchases' => $purchases,
            'collections' => $collections
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Er ging iets fout bij het inloggen']);
}
