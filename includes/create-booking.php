<?php
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    exit;
}

require_once 'db-config.php';
require_once 'email-template.php';

/* ============================================================
   VALIDATIE & SANITIZE
============================================================ */
$service  = isset($_POST['service']) ? trim($_POST['service']) : '';
$duration = isset($_POST['duration']) ? trim($_POST['duration']) : '';
$price    = isset($_POST['price']) ? (float) $_POST['price'] : 0;
$date     = isset($_POST['booking_date']) ? trim($_POST['booking_date']) : '';
$time     = isset($_POST['booking_time']) ? trim($_POST['booking_time']) : '';
$naam     = isset($_POST['customer_name']) ? trim($_POST['customer_name']) : '';
$email    = isset($_POST['customer_email']) ? trim($_POST['customer_email']) : '';
$telefoon = isset($_POST['customer_phone']) ? trim($_POST['customer_phone']) : '';
$notities = isset($_POST['notes']) ? trim($_POST['notes']) : '';

if ($service === '' || $duration === '' || $date === '' || $time === '' || $naam === '' || $email === '' || $telefoon === '') {
    die("Niet alle verplichte velden zijn ingevuld.");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Ongeldig e-mailadres.");
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    die("Ongeldige datum.");
}

if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $time)) {
    die("Ongeldige tijd.");
}

if ($price <= 0) {
    die("Ongeldige prijs.");
}

$service  = htmlspecialchars($service, ENT_QUOTES, 'UTF-8');
$duration = htmlspecialchars($duration, ENT_QUOTES, 'UTF-8');
$naam     = htmlspecialchars($naam, ENT_QUOTES, 'UTF-8');
$email    = filter_var($email, FILTER_SANITIZE_EMAIL);
$telefoon = htmlspecialchars($telefoon, ENT_QUOTES, 'UTF-8');
$notities = htmlspecialchars($notities, ENT_QUOTES, 'UTF-8');

$userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;

/* ============================================================
   OPSLAAN IN DATABASE
============================================================ */
try {
    $stmt = $pdo->prepare("
        INSERT INTO bookings (user_id, service, duration, price, booking_date, booking_time, customer_name, customer_email, customer_phone, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ");
    $stmt->execute([$userId, $service, $duration, $price, $date, $time, $naam, $email, $telefoon, $notities]);
} catch (PDOException $e) {
    error_log("Create booking error: " . $e->getMessage());
    die("Er ging iets mis bij het opslaan van je boeking. Probeer het later opnieuw.");
}

/* ============================================================
   BEVESTIGINGSMAILS (mislukte mail blokkeert de boeking niet)
============================================================ */
$ontvanger = "info@miss-jolie.store";
$onderwerp = "Nieuwe boeking: $service ($duration)";
$prijsLabel = number_format($price, 2, ',', '.');

$emailContentMissJolie = '
    <p><strong>Nieuwe boeking ontvangen</strong></p>
    <div class="divider"></div>
    <p><strong>Service:</strong> ' . $service . '</p>
    <p><strong>Tarief/duur:</strong> ' . $duration . '</p>
    <p><strong>Prijs:</strong> &euro;' . $prijsLabel . '</p>
    <p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>
    <p><strong>Tijd:</strong> ' . htmlspecialchars($time) . '</p>
    <div class="divider"></div>
    <p><strong>Naam:</strong> ' . $naam . '</p>
    <p><strong>E-mail:</strong> <a href="mailto:' . $email . '" style="color: #d896ff;">' . $email . '</a></p>
    <p><strong>Telefoon:</strong> ' . $telefoon . '</p>
    ' . ($notities !== '' ? '<p><strong>Opmerking:</strong></p><p style="background-color: #1a0033; padding: 15px; border-left: 3px solid #d896ff;">' . nl2br($notities) . '</p>' : '') . '
';

$emailContentKlant = '
    <p>Beste ' . $naam . ',</p>
    <p>Bedankt voor je boeking! We hebben je aanvraag succesvol ontvangen.</p>
    <div class="divider"></div>
    <p><strong>Service:</strong> ' . $service . '</p>
    <p><strong>Tarief/duur:</strong> ' . $duration . '</p>
    <p><strong>Prijs:</strong> &euro;' . $prijsLabel . '</p>
    <p><strong>Datum:</strong> ' . htmlspecialchars($date) . '</p>
    <p><strong>Tijd:</strong> ' . htmlspecialchars($time) . '</p>
    <div class="divider"></div>
    <p><strong>Wat kun je verwachten?</strong></p>
    <p>Miss Jolie bevestigt je boeking doorgaans binnen <strong>24 uur</strong> op het e-mailadres: <a href="mailto:' . $email . '" style="color: #d896ff;">' . $email . '</a></p>
    <p style="margin-top: 30px;">Met vriendelijke groet,<br><strong style="color: #d896ff;">Miss Jolie</strong></p>
';

try {
    sendHtmlEmail($ontvanger, $onderwerp, $emailContentMissJolie, "Nieuwe boeking - Miss Jolie");
    sendHtmlEmail($email, "Bevestiging: Je boeking bij Miss Jolie", $emailContentKlant, "Boekingsbevestiging - Miss Jolie");
} catch (Throwable $e) {
    error_log("Create booking email error: " . $e->getMessage());
}

echo "SUCCESS";
?>
