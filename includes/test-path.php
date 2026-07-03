<?php
/* ============================================================
   TEST SCRIPT - Vind je absolute server pad
   Upload dit bestand en bezoek het in je browser
============================================================ */

echo "<h2>Server Path Informatie</h2>";
echo "<hr>";

echo "<h3>📁 Absolute Pad naar dit bestand:</h3>";
echo "<pre style='background: #f4f4f4; padding: 15px; border-radius: 5px; font-size: 14px;'>";
echo __FILE__;
echo "</pre>";

echo "<h3>📂 Directory van dit bestand:</h3>";
echo "<pre style='background: #f4f4f4; padding: 15px; border-radius: 5px; font-size: 14px;'>";
echo __DIR__;
echo "</pre>";

echo "<hr>";
echo "<h3>🔧 Voor Cron Job gebruik je:</h3>";
echo "<pre style='background: #d4edda; padding: 15px; border-radius: 5px; font-size: 14px; font-weight: bold;'>";
$reminderScript = __DIR__ . '/send-booking-reminders.php';
echo $reminderScript;
echo "</pre>";

echo "<hr>";
echo "<h3>⏰ Volledige Cron Command:</h3>";
echo "<pre style='background: #fff3cd; padding: 15px; border-radius: 5px; font-size: 14px;'>";
echo "/usr/bin/php " . $reminderScript;
echo "</pre>";

echo "<hr>";
echo "<h3>💡 Instructies voor TransIP Cron Job:</h3>";
echo "<ol style='line-height: 2;'>";
echo "<li><strong>Script dat moet worden uitgevoerd:</strong><br>";
echo "Kopieer: <code style='background: #f4f4f4; padding: 5px;'>" . $reminderScript . "</code></li>";
echo "<li><strong>Minuut:</strong> Elke 5 minuten (voor testen) of 0 (voor productie)</li>";
echo "<li><strong>Uur:</strong> */2 (elke 2 uur) of * (elk uur)</li>";
echo "<li><strong>Dag van de maand:</strong> Elke dag van de maand</li>";
echo "<li><strong>Maand:</strong> Elke maand</li>";
echo "<li><strong>Dag van de week:</strong> Elke dag van de week</li>";
echo "</ol>";

echo "<hr>";
echo "<h3>✅ Test of script werkt:</h3>";
echo "<p>Bezoek: <a href='send-booking-reminders.php' target='_blank'>send-booking-reminders.php</a></p>";

echo "<hr>";
echo "<h3>📋 Server Info:</h3>";
echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
echo "<tr><td><strong>PHP Version</strong></td><td>" . phpversion() . "</td></tr>";
echo "<tr><td><strong>Server Software</strong></td><td>" . $_SERVER['SERVER_SOFTWARE'] . "</td></tr>";
echo "<tr><td><strong>Document Root</strong></td><td>" . $_SERVER['DOCUMENT_ROOT'] . "</td></tr>";
echo "<tr><td><strong>Script Filename</strong></td><td>" . $_SERVER['SCRIPT_FILENAME'] . "</td></tr>";
echo "</table>";
