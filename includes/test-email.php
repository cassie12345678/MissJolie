<?php
/* ============================================================
   TEST EMAIL FUNCTIONALITEIT
   Run dit script om te testen of emails werken
============================================================ */

require_once 'email-template.php';

echo "<h2>Email Test Script</h2>";
echo "<p>Testing email functionality...</p>";

// Test email adres (verander dit naar jouw email)
$testEmail = "info@miss-jolie.store"; // VERANDER DIT NAAR JOUW EMAIL

$emailContent = '
    <h2 style="color: #d896ff;">✅ Test Email</h2>
    <p>Hallo,</p>
    <p>Dit is een test email van Miss Jolie booking systeem.</p>
    <p>Als je deze email ontvangt, werkt de email functionaliteit correct!</p>
    
    <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h3 style="color: #d896ff;">📧 Test Details</h3>
        <p style="margin: 8px 0;"><strong>Server:</strong> ' . $_SERVER['SERVER_NAME'] . '</p>
        <p style="margin: 8px 0;"><strong>PHP Versie:</strong> ' . phpversion() . '</p>
        <p style="margin: 8px 0;"><strong>Tijdstip:</strong> ' . date('Y-m-d H:i:s') . '</p>
    </div>
    
    <p>Groetjes,<br><strong style="color: #d896ff;">Miss Jolie Test</strong></p>
';

echo "<p>Versturen naar: <strong>$testEmail</strong></p>";

try {
    if (sendHtmlEmail($testEmail, "Test Email - Miss Jolie", $emailContent)) {
        echo "<p style='color: green;'><strong>✓ Email succesvol verstuurd!</strong></p>";
        echo "<p>Check je inbox (en spam folder) op: $testEmail</p>";
    } else {
        echo "<p style='color: red;'><strong>✗ Email versturen mislukt!</strong></p>";
        echo "<p>Mogelijke oorzaken:</p>";
        echo "<ul>";
        echo "<li>PHP mail() functie is niet geconfigureerd</li>";
        echo "<li>Geen mail server op localhost (normaal voor lokale ontwikkeling)</li>";
        echo "<li>Test op de live TransIP server voor echte email functionaliteit</li>";
        echo "</ul>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'><strong>Error:</strong> " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h3>Mail Configuratie Info:</h3>";
echo "<ul>";
echo "<li>mail() functie beschikbaar: " . (function_exists('mail') ? '✓ Ja' : '✗ Nee') . "</li>";
echo "<li>SMTP ingesteld: " . (ini_get('SMTP') ?: 'Niet ingesteld (default)') . "</li>";
echo "<li>sendmail_path: " . (ini_get('sendmail_path') ?: 'Niet ingesteld') . "</li>";
echo "</ul>";

echo "<hr>";
echo "<h3>Wat te doen?</h3>";
echo "<p><strong>Voor lokaal testen (localhost/127.0.0.1):</strong></p>";
echo "<ul>";
echo "<li>Emails werken meestal NIET lokaal zonder extra configuratie</li>";
echo "<li>Installeer een test mail server zoals <a href='https://github.com/rnwood/smtp4dev' target='_blank'>smtp4dev</a></li>";
echo "<li>Of test direct op de live TransIP server</li>";
echo "</ul>";

echo "<p><strong>Voor live server (TransIP):</strong></p>";
echo "<ul>";
echo "<li>Upload alle bestanden naar de server</li>";
echo "<li>Run dit script op: https://miss-jolie.store/includes/test-email.php</li>";
echo "<li>Emails zouden direct moeten werken</li>";
echo "</ul>";
