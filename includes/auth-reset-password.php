<?php
/* ============================================================
   WACHTWOORD RESET - RESET MET TOKEN
   POST: token, new_password
============================================================ */

header('Content-Type: application/json');
require_once 'db-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Alleen POST verzoeken toegestaan']));
}

$data = json_decode(file_get_contents('php://input'), true);
$token = isset($data['token']) ? trim($data['token']) : '';
$newPassword = isset($data['new_password']) ? $data['new_password'] : '';

if (empty($token) || empty($newPassword)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Token en nieuw wachtwoord zijn verplicht']));
}

if (strlen($newPassword) < 8) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Wachtwoord moet minimaal 8 karakters zijn']));
}

try {
    // Check token
    $stmt = $pdo->prepare("
        SELECT id, email 
        FROM users 
        WHERE reset_token = ? 
        AND reset_token_expires > NOW()
    ");
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Ongeldige of verlopen reset link']));
    }
    
    // Update wachtwoord en verwijder token
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("
        UPDATE users 
        SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL 
        WHERE id = ?
    ");
    $stmt->execute([$passwordHash, $user['id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Wachtwoord succesvol gewijzigd'
    ]);
    
} catch (PDOException $e) {
    error_log("Password reset error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Er ging iets fout']);
}
