<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', $auth);

// Token dekódolása és username kinyerése
$decoded = base64_decode($token);
if (!$decoded) {
    http_response_code(401);
    echo json_encode(["message" => "Érvénytelen token"]);
    exit;
}

$parts = explode(':', $decoded);
$oldUsername = $parts[0] ?? null;

$data = json_decode(file_get_contents("php://input"), true);
$newUsername = $data['newUsername'] ?? null;

if (!$oldUsername || !$newUsername) {
    http_response_code(400);
    echo json_encode(["message" => "Hiányzó adatok"]);
    exit;
}

$conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Adatbázis hiba"]);
    exit;
}

// Ellenőrzés
$stmt = $conn->prepare("SELECT username FROM users WHERE username = ?");
$stmt->bind_param("s", $newUsername);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    http_response_code(409);
    echo json_encode(["message" => "Ez a felhasználónév már foglalt"]);
    exit;
}

// Frissítés mindkét táblában prepared statement-tel
$updateUsers = $conn->prepare("UPDATE users SET username = ? WHERE username = ?");
$updateUsers->bind_param("ss", $newUsername, $oldUsername);
$updateUsers->execute();
$updateUsers->close();

$updateScores = $conn->prepare("UPDATE scores SET username = ? WHERE username = ?");
$updateScores->bind_param("ss", $newUsername, $oldUsername);
$updateScores->execute();
$updateScores->close();

$newToken = base64_encode($newUsername . ':' . time());
echo json_encode(["message" => "Felhasználónév módosítva", "token" => $newToken]);

$conn->close();
?>
