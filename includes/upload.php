<?php
header("Content-Type: application/json");

$dir = "../images/uploads/";

if (!file_exists($dir)) {
    mkdir($dir, 0777, true);
}

if (!isset($_FILES["file"]) && !isset($_FILES["image"])) {
    echo json_encode(["success" => false, "error" => "No file uploaded"]);
    exit;
}

$file = isset($_FILES["file"]) ? $_FILES["file"] : $_FILES["image"];
$ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
$allowed = ["jpg","jpeg","png","webp","gif"];

if (!in_array($ext, $allowed)) {
    echo json_encode(["success" => false, "msg" => "Ongeldig bestand", "error" => "Invalid file type"]);
    exit;
}

$newName = time() . "_" . rand(1000,9999) . "." . $ext;
$path = $dir . $newName;

if (move_uploaded_file($file["tmp_name"], $path)) {
    echo json_encode([
        "success" => true, 
        "url" => "images/uploads/" . $newName,
        "path" => "images/uploads/" . $newName
    ]);
} else {
    echo json_encode(["success" => false, "error" => "Failed to move uploaded file"]);
}
?>
