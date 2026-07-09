<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Locatie van het echte JSON-bestand
$discountFile = __DIR__ . "/discount-codes.json";

// Ontvangen JSON data uit admin.js
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || !isset($data["codes"]) || !is_array($data["codes"])) {
    echo json_encode(["success" => false, "error" => "No valid data received"]);
    exit;
}

// Basisvalidatie per code
foreach ($data["codes"] as $code) {
    if (empty($code["code"]) || !isset($code["type"]) || !in_array($code["type"], ["percentage", "fixed"], true)) {
        echo json_encode(["success" => false, "error" => "Ongeldige kortingscode in de lijst"]);
        exit;
    }
}

$newJson = [
    "codes" => $data["codes"]
];

// Backup maken voordat we overschrijven
$backupDir = __DIR__ . "/../data/";
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0777, true);
}
$backupName = $backupDir . "discount-codes-backup-" . date("Y-m-d-H-i-s") . ".json";
if (file_exists($discountFile)) {
    copy($discountFile, $backupName);
}

$result = file_put_contents(
    $discountFile,
    json_encode($newJson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
);

if ($result === false) {
    echo json_encode(["success" => false, "error" => "Failed to write to file"]);
} else {
    echo json_encode(["success" => true, "message" => "Discount codes saved successfully"]);
}
exit;
