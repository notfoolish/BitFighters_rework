<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$token = $_GET['token'] ?? '';
if (!$token) {
    http_response_code(400);
    echo json_encode(["message" => "Hiányzó token"]);
    exit;
}

$conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Adatbázis hiba"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, email_verify_token_expires FROM users WHERE email_verify_token = ? AND email_verified = 0");
$stmt->bind_param("s", $token);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) {
    http_response_code(400);
    echo json_encode(["message" => "Érvénytelen vagy már felhasznált token"]);
    exit;
}
$stmt->bind_result($userId, $tokenExpires);
$stmt->fetch();

if ($tokenExpires && strtotime($tokenExpires) < time()) {
    http_response_code(400);
    echo json_encode(["message" => "A token lejárt"]);
    exit;
}

$update = $conn->prepare("UPDATE users SET email_verified = 1, email_verified_at = NOW(), email_verify_token = NULL, email_verify_token_expires = NULL WHERE id = ?");
$update->bind_param("i", $userId);
$update->execute();

echo json_encode(["message" => "Email megerősítve"]);

$update->close();
$stmt->close();
$conn->close();
?>
