<?php
/* ============================================================
   CHECK SESSION - CONTROLEER OF USER IS INGELOGD
   GET
============================================================ */

header('Content-Type: application/json');
require_once 'db-config.php';

function tableExists(PDO $pdo, string $tableName): bool {
    try {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$tableName]);
        return (bool) $stmt->fetchColumn();
    } catch (PDOException $e) {
        return false;
    }
}

function columnExists(PDO $pdo, string $tableName, string $columnName): bool {
    try {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM `{$tableName}` LIKE ?");
        $stmt->execute([$columnName]);
        return (bool) $stmt->fetchColumn();
    } catch (PDOException $e) {
        return false;
    }
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['success' => false, 'authenticated' => false]));
}

try {
    $userId = $_SESSION['user_id'];
    
    // Haal user data op
    $stmt = $pdo->prepare("SELECT id, email FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        session_unset();
        session_destroy();
        http_response_code(401);
        die(json_encode(['success' => false, 'authenticated' => false]));
    }
    
    $isAdmin = 0;
    try {
        $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $adminRow = $stmt->fetch();
        $isAdmin = intval($adminRow['is_admin'] ?? 0);
    } catch (Throwable $e) {
        $isAdmin = 0;
    }

    $purchases = [];
    try {
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
                $stmt->execute([$userId]);
                $purchases = $stmt->fetchAll();
                break;
            } catch (Throwable $e) {
                // Try next schema variant.
            }
        }
    } catch (Throwable $e) {
        error_log("Session check purchases query error: " . $e->getMessage());
        $purchases = [];
    }

    $collections = [];
    try {
        $collectionQueryVariants = [
            "SELECT collection_id, purchased_at FROM user_collections WHERE user_id = ?",
            "SELECT collection_id, created_at AS purchased_at FROM user_collections WHERE user_id = ?",
            "SELECT collection_id, NULL AS purchased_at FROM user_collections WHERE user_id = ?"
        ];

        foreach ($collectionQueryVariants as $sql) {
            try {
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$userId]);
                $collections = $stmt->fetchAll();
                break;
            } catch (Throwable $e) {
                // Try next schema variant.
            }
        }
    } catch (Throwable $e) {
        error_log("Session check collections query error: " . $e->getMessage());
        $collections = [];
    }

    $bookings = [];
    try {
        $bookingQueryVariants = [
            "SELECT id, service, duration, price, booking_date, booking_time,
                    customer_name, customer_email, customer_phone, notes,
                    status, payment_status, created_at
             FROM bookings
             WHERE user_id = ?
             ORDER BY booking_date DESC, booking_time DESC",
            "SELECT id, service, duration, price, booking_date, booking_time,
                    customer_name, customer_email, customer_phone, notes,
                    status, NULL AS payment_status, created_at
             FROM bookings
             WHERE user_id = ?
             ORDER BY booking_date DESC, booking_time DESC",
            "SELECT id, service, duration, price, booking_date, booking_time,
                    customer_name, customer_email, customer_phone, notes,
                    status, NULL AS payment_status, NULL AS created_at
             FROM bookings
             WHERE user_id = ?
             ORDER BY booking_date DESC, booking_time DESC"
        ];

        foreach ($bookingQueryVariants as $sql) {
            try {
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$userId]);
                $bookings = $stmt->fetchAll();
                break;
            } catch (Throwable $e) {
                // Try next schema variant.
            }
        }
    } catch (Throwable $e) {
        error_log("Session check bookings query error: " . $e->getMessage());
        $bookings = [];
    }
    
    // Voeg tier toe aan elke aankoop door het eerste woord na " - " te pakken
    // item_name formaat: "Collectie Naam - tier - beschrijving"
    foreach ($purchases as &$purchase) {
        $itemName = $purchase['item_name'] ?? '';
        $itemId = $purchase['item_id'] ?? '';
        $extractedTier = null;

        // Primaire methode: verwijder item_id prefix, pak eerste woord na " - "
        if (!empty($itemId) && !empty($itemName) && strlen($itemName) > strlen($itemId)) {
            $suffix = substr($itemName, strlen($itemId));
            if (preg_match('/^\s*-\s*(\S+)/', $suffix, $m)) {
                $extractedTier = strtolower(trim($m[1]));
            }
        }

        // Fallback: pak eerste woord direct na " - " in item_name
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
        'authenticated' => true,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'is_admin' => $isAdmin,
            'purchases' => $purchases,
            'collections' => $collections,
            'bookings' => $bookings
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Session check error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'authenticated' => false]);
}
