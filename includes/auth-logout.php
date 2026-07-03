<?php
/* ============================================================
   LOGOUT ENDPOINT
============================================================ */

header('Content-Type: application/json');
require_once 'db-config.php';

// Verwijder sessie
session_unset();
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Succesvol uitgelogd'
]);
