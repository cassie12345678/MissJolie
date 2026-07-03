<?php
/* ============================================================
   UPDATE BOOKING STATUS
============================================================ */

header('Content-Type: application/json');

require_once 'db-config.php';

$data = json_decode(file_get_contents("php://input"), true);
$bookingId = $data['id'] ?? null;
$status = $data['status'] ?? null;
$date = $data['date'] ?? null;
$time = $data['time'] ?? null;
$notes = $data['notes'] ?? null;

if (!$bookingId) {
    echo json_encode(['success' => false, 'error' => 'Booking ID is required']);
    exit;
}

try {
    $updates = [];
    $params = [];
    
    if ($status) {
        $updates[] = "status = ?";
        $params[] = $status;
    }
    if ($date) {
        $updates[] = "booking_date = ?";
        $params[] = $date;
    }
    if ($time) {
        $updates[] = "booking_time = ?";
        $params[] = $time;
    }
    if ($notes !== null) {
        $updates[] = "notes = ?";
        $params[] = $notes;
    }
    
    $params[] = $bookingId;
    
    $stmt = $pdo->prepare("
        UPDATE bookings 
        SET " . implode(", ", $updates) . "
        WHERE id = ?
    ");
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'Booking updated successfully'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
