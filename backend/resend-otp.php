<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['email'])) {
    http_response_code(400);
    echo json_encode(["message" => "Hiányzó email"]);
    exit;
}

$email = $data['email'];

$conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Adatbázis hiba"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, email_verified, email_otp_expires FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["message" => "Felhasználó nem található"]);
    exit;
}
$stmt->bind_result($userId, $emailVerified, $otpExpires);
$stmt->fetch();

if ((int)$emailVerified === 1) {
    echo json_encode(["message" => "Email már megerősítve"]);
    exit;
}

if ($otpExpires) {
    $sentAt = strtotime($otpExpires) - (15 * 60);
    if ($sentAt && (time() - $sentAt) < 60) {
        http_response_code(429);
        echo json_encode(["message" => "Kérjük, várj 1 percet az új kód kéréséhez."]);
        exit;
    }
}

$otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$otpHash = password_hash($otp, PASSWORD_DEFAULT);
$otpExpires = date('Y-m-d H:i:s', time() + 15 * 60);

$update = $conn->prepare("UPDATE users SET email_otp_hash = ?, email_otp_expires = ? WHERE id = ?");
$update->bind_param("ssi", $otpHash, $otpExpires, $userId);
$update->execute();

$subject = 'Email megerősítés - BitFighters';
$message = "Az új megerősítő kódod: $otp";
$headers = 'From: no-reply@bitfighters.local';
@mail($email, $subject, $message, $headers);

echo json_encode(["message" => "Új megerősítő kód elküldve."]);

$update->close();
$stmt->close();
$conn->close();
?>
