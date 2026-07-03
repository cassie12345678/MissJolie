<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Locatie van het echte JSON-bestand
$collectionsFile = __DIR__ . "/collections.json";

// Ontvangen JSON data uit admin.js of account.js
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Als geen data → error
if (!$data || !isset($data["collections"])) {
    echo json_encode(["success" => false, "error" => "No valid data received"]);
    exit;
}

// JSON structuur correct opbouwen
$newJson = [
    "collections" => $data["collections"]
];

// **Optioneel maar slim:** backup maken
$backupDir = __DIR__ . "/../data/";
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0777, true);
}
$backupName = $backupDir . "collections-backup-" . date("Y-m-d-H-i-s") . ".json";
if (file_exists($collectionsFile)) {
    copy($collectionsFile, $backupName);
}

// Nieuwe data naar collections.json schrijven
$result = file_put_contents(
    $collectionsFile,
    json_encode($newJson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
);

if ($result === false) {
    echo json_encode(["success" => false, "error" => "Failed to write to file"]);
} else {
    echo json_encode(["success" => true, "message" => "Collections saved successfully"]);
}
exit;
?>
