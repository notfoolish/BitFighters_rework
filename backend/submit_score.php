<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['username']) || !isset($data['score'])) {
    http_response_code(400);
    echo json_encode(["message" => "Hiányzó adatok"]);
    exit;
}

$username = $data['username'];
$score = intval($data['score']);

$conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Adatbázis hiba"]);
    exit;
}

// 1. Pont beszúrása
$stmt = $conn->prepare("INSERT INTO scores (username, score) VALUES (?, ?)");
$stmt->bind_param("si", $username, $score);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["message" => "Sikertelen pontmentés", "error" => $stmt->error]);
    exit;
}
$stmt->close();

// 2. highest_score frissítése a users táblában
$update = $conn->prepare("UPDATE users SET highest_score = GREATEST(highest_score, ?) WHERE username = ?");
$update->bind_param("is", $score, $username);
$update->execute();
$update->close();

$conn->close();
echo json_encode(["message" => "Pont elmentve és frissítve"]);
?>
