<?php
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    exit;
}

/* ============================================================
   VALIDATIE & SANITIZE
============================================================ */
$naam     = isset($_POST['naam']) ? trim($_POST['naam']) : '';
$email    = isset($_POST['email']) ? trim($_POST['email']) : '';
$bericht  = isset($_POST['bericht']) ? trim($_POST['bericht']) : '';
$telefoon = isset($_POST['telefoon']) ? trim($_POST['telefoon']) : '';

// Verplichte velden check
if ($naam === '' || $email === '' || $bericht === '') {
    die("Niet alle verplichte velden zijn ingevuld.");
}

// E-mail validatie
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Ongeldig e-mailadres.");
}

// Sanitize
$naam     = htmlspecialchars($naam, ENT_QUOTES, 'UTF-8');
$email    = filter_var($email, FILTER_SANITIZE_EMAIL);
$bericht  = htmlspecialchars($bericht, ENT_QUOTES, 'UTF-8');
$telefoon = htmlspecialchars($telefoon, ENT_QUOTES, 'UTF-8');

/* ============================================================
   MAIL INSTELLINGEN
============================================================ */
require_once 'email-template.php';

$ontvanger = "info@miss-jolie.store";
$onderwerp = "Nieuw contactbericht van $naam";

/* ============================================================
   MAIL BODY VOOR MISS JOLIE (HTML VERSION)
============================================================ */
$emailContentMissJolie = '
    <p><strong>Nieuw contactbericht ontvangen</strong></p>
    <div class="divider"></div>
    <p><strong>Naam:</strong> ' . $naam . '</p>
    <p><strong>E-mail:</strong> <a href="mailto:' . $email . '" style="color: #d896ff;">' . $email . '</a></p>
    <p><strong>Telefoon:</strong> ' . ($telefoon !== '' ? $telefoon : "Niet opgegeven") . '</p>
    <div class="divider"></div>
    <p><strong>Bericht:</strong></p>
    <p style="background-color: #1a0033; padding: 15px; border-left: 3px solid #d896ff;">' . nl2br($bericht) . '</p>
';

/* ============================================================
   BEVESTIGING EMAIL VOOR KLANT
============================================================ */
$emailContentKlant = '
    <p>Beste ' . $naam . ',</p>
    <p>Bedankt voor je bericht! We hebben je contactaanvraag succesvol ontvangen.</p>
    <div class="divider"></div>
    <p><strong>Je bericht:</strong></p>
    <p style="background-color: #1a0033; padding: 15px; border-left: 3px solid #d896ff;">' . nl2br($bericht) . '</p>
    <div class="divider"></div>
    <p><strong>Wat kun je verwachten?</strong></p>
    <p>Miss Jolie streeft ernaar om binnen <strong>24 uur</strong> te reageren op je bericht. Je ontvangt een persoonlijk antwoord op het e-mailadres: <a href="mailto:' . $email . '" style="color: #d896ff;">' . $email . '</a></p>
    <p style="margin-top: 30px;">Met vriendelijke groet,<br><strong style="color: #d896ff;">Miss Jolie</strong></p>
';

/* ============================================================
   VERZENDEN
============================================================ */
$successMissJolie = sendHtmlEmail($ontvanger, $onderwerp, $emailContentMissJolie, "Contact - Miss Jolie");
$successKlant = sendHtmlEmail($email, "Bevestiging: Je bericht aan Miss Jolie", $emailContentKlant, "Bevestiging - Miss Jolie");

if ($successMissJolie && $successKlant) {
    echo "SUCCESS";
} else {
    echo "Er ging iets mis bij het verzenden. Probeer het later opnieuw.";
}
?>
