<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['email']) || !isset($data['code'])) {
    http_response_code(400);
    echo json_encode(["message" => "Hiányzó adatok"]);
    exit;
}

$email = $data['email'];
$code = $data['code'];

$conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Adatbázis hiba"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, email_otp_hash, email_otp_expires, email_verified FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["message" => "Felhasználó nem található"]);
    exit;
}
$stmt->bind_result($userId, $otpHash, $otpExpires, $emailVerified);
$stmt->fetch();

if ((int)$emailVerified === 1) {
    echo json_encode(["message" => "Email már megerősítve"]);
    exit;
}

if (!$otpHash || !$otpExpires || strtotime($otpExpires) < time()) {
    http_response_code(400);
    echo json_encode(["message" => "A megerősítő kód lejárt"]);
    exit;
}

if (!password_verify($code, $otpHash)) {
    http_response_code(400);
    echo json_encode(["message" => "Hibás megerősítő kód"]);
    exit;
}

$update = $conn->prepare("UPDATE users SET email_verified = 1, email_verified_at = NOW(), email_otp_hash = NULL, email_otp_expires = NULL WHERE id = ?");
$update->bind_param("i", $userId);
$update->execute();

echo json_encode(["message" => "Email megerősítve"]);

$update->close();
$stmt->close();
$conn->close();
?>
