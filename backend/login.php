<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(["message" => "Hiányzó adatok."]);
    exit;
}

$username = $data['username'];
$password = $data['password'];

$conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Adatbázis hiba"]);
    exit;
}

$stmt = $conn->prepare("SELECT password, email_verified FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["message" => "Hibás felhasználónév vagy jelszó"]);
    exit;
}
$stmt->bind_result($storedPassword, $emailVerified);
$stmt->fetch();

if (!password_verify($password, $storedPassword)) {
    http_response_code(401);
    echo json_encode(["message" => "Hibás felhasználónév vagy jelszó"]);
    exit;
}

if ((int)$emailVerified !== 1) {
    http_response_code(403);
    echo json_encode(["message" => "Email nincs megerősítve"]);
    exit;
}

$token = base64_encode($username . ':' . time());
echo json_encode(["message" => "Sikeres bejelentkezés", "token" => $token]);

$stmt->close();
$conn->close();
?>
