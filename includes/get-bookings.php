<?php
/* ============================================================
   GET BOOKINGS FROM DATABASE
============================================================ */

header('Content-Type: application/json');

require_once 'db-config.php';

try {
    // Get all bookings with user info
    $stmt = $pdo->prepare("
        SELECT 
            b.*,
            u.email as user_email
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.booking_date DESC, b.booking_time DESC
    ");
    $stmt->execute();
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'bookings' => $bookings
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
