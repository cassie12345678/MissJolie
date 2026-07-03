<?php
/* ============================================================
   WACHTWOORD VERGETEN - STUUR RESET EMAIL
   POST: email
============================================================ */

require_once 'db-config.php';

// Set headers first
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Alleen POST verzoeken toegestaan']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$email = isset($data['email']) ? trim($data['email']) : '';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Geldig email adres is verplicht']);
    exit;
}

try {
    // Check of user bestaat
    $stmt = $pdo->prepare("SELECT id, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Geef altijd success terug (om email enumeration te voorkomen)
        echo json_encode([
            'success' => true,
            'message' => 'Als dit email adres bestaat, is er een reset link verstuurd'
        ]);
        exit;
    }
    
    // Genereer reset token
    $resetToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Sla token op
    $stmt = $pdo->prepare("
        UPDATE users 
        SET reset_token = ?, reset_token_expires = ? 
        WHERE id = ?
    ");
    $stmt->execute([$resetToken, $expiresAt, $user['id']]);
    
    // Maak reset link
    $resetLink = "https://miss-jolie.store/wachtwoord-reset.html?token=" . $resetToken;
    
    // Stuur HTML email
    require_once 'email-template.php';
    
    $emailContent = '
        <p>Hallo,</p>
        <p>Je hebt een wachtwoord reset aangevraagd voor je Miss Jolie account.</p>
        <p>Klik op de onderstaande knop om je wachtwoord te resetten:</p>
        <p style="text-align: center;">
            <a href="' . $resetLink . '" class="email-button">Wachtwoord Resetten</a>
        </p>
        <p style="font-size: 14px; color: #888;">
            Of kopieer deze link naar je browser:<br>
            <a href="' . $resetLink . '" style="color: #d896ff;">' . $resetLink . '</a>
        </p>
        <div class="divider"></div>
        <p style="font-size: 14px;">Deze link is 1 uur geldig.</p>
        <p style="font-size: 14px;">Als je deze aanvraag niet hebt gedaan, kun je deze email negeren.</p>
        <p style="margin-top: 30px;">Groetjes,<br><strong style="color: #d896ff;">Miss Jolie</strong></p>
    ';
    
    sendHtmlEmail($user['email'], "Wachtwoord reset - Miss Jolie", $emailContent);
    
    echo json_encode([
        'success' => true,
        'message' => 'Reset link is verstuurd naar je email'
    ]);
    
} catch (PDOException $e) {
    error_log("Password reset error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Er ging iets fout']);
}
