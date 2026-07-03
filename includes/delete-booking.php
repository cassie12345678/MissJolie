<?php
/* ============================================================
   DELETE BOOKING
============================================================ */

header('Content-Type: application/json');

require_once 'db-config.php';

$data = json_decode(file_get_contents("php://input"), true);
$bookingId = $data['id'] ?? null;

if (!$bookingId) {
    echo json_encode(['success' => false, 'error' => 'Booking ID is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM bookings WHERE id = ?");
    $stmt->execute([$bookingId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Booking deleted successfully'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
