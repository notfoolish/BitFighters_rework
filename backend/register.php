<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(["message" => "Hiányzó adatok"]);
    exit;
}

$username = $data['username'];
$email = $data['email'];
$password = $data['password'];
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Adatbázis hiba"]);
    exit;
}

$otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$otpHash = password_hash($otp, PASSWORD_DEFAULT);
$otpExpires = date('Y-m-d H:i:s', time() + 15 * 60);

$stmt = $conn->prepare("INSERT INTO users (username, email, password, email_verified, email_otp_hash, email_otp_expires) VALUES (?, ?, ?, 0, ?, ?)");
$stmt->bind_param("sssss", $username, $email, $passwordHash, $otpHash, $otpExpires);
if (!$stmt->execute()) {
    if ($stmt->errno === 1062) {
        http_response_code(409);
        echo json_encode(["message" => "Ez a felhasználónév vagy email már létezik"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Hiba a regisztrációnál"]);
    }
    exit;
}

$subject = 'Email megerősítés - BitFighters';
$message = "Köszönjük a regisztrációt! A megerősítő kódod: $otp";
$headers = 'From: no-reply@bitfighters.local';
@mail($email, $subject, $message, $headers);

echo json_encode(["message" => "Sikeres regisztráció! A megerősítő kódot elküldtük emailben."]);
$stmt->close();
$conn->close();
?>
