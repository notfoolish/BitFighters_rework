<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', $auth);
$username = explode(':', base64_decode($token))[0] ?? null;

$data = json_decode(file_get_contents("php://input"), true);
$newPassword = $data['newPassword'] ?? null;

if (!$username || !$newPassword) {
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

$check = $conn->prepare("SELECT email_verified FROM users WHERE username = ?");
$check->bind_param("s", $username);
$check->execute();
$check->bind_result($emailVerified);
$check->fetch();
$check->close();

if ((int)$emailVerified !== 1) {
    http_response_code(403);
    echo json_encode(["message" => "Email nincs megerősítve"]);
    $conn->close();
    exit;
}

$hashed = password_hash($newPassword, PASSWORD_DEFAULT);
$stmt = $conn->prepare("UPDATE users SET password = ? WHERE username = ?");
$stmt->bind_param("ss", $hashed, $username);
$stmt->execute();

echo json_encode(["message" => "Jelszó sikeresen módosítva"]);
$conn->close();
?>
