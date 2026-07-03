<?php
/* ============================================================
   REGISTRATIE ENDPOINT
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

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Ongeldig email adres']));
}

if (strlen($password) < 8) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Wachtwoord moet minimaal 8 karakters zijn']));
}

try {
    // Check of email al bestaat
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        http_response_code(409);
        die(json_encode(['success' => false, 'message' => 'Dit email adres is al geregistreerd']));
    }
    
    // Hash wachtwoord en insert user
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
    $stmt->execute([$email, $passwordHash]);
    
    $userId = $pdo->lastInsertId();
    
    // Maak sessie
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_email'] = $email;
    
    echo json_encode([
        'success' => true,
        'message' => 'Account succesvol aangemaakt',
        'user' => [
            'id' => $userId,
            'email' => $email
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Registratie error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Er ging iets fout bij het aanmaken van het account']);
}
