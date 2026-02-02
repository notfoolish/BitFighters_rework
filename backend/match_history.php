<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

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
$username = $parts[0] ?? null;

if (!$username) {
    http_response_code(401);
    echo json_encode(["message" => "Hiányzó vagy érvénytelen token"]);
    exit;
}

$conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Adatbázis hiba"]);
    exit;
}

$stmt = $conn->prepare("SELECT username, score, created_at FROM scores WHERE username = ? ORDER BY created_at DESC LIMIT 10");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

$history = [];
while ($row = $result->fetch_assoc()) {
    $history[] = $row;
}

echo json_encode($history);
$conn->close();
?>
