<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

$conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Adatbázis hiba"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $stmt = $conn->prepare("SELECT id, title, content, created_at FROM patchnotes WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        echo json_encode($result->fetch_assoc());
        exit;
    }
    $result = $conn->query("SELECT id, title, content, created_at FROM patchnotes ORDER BY created_at DESC");
    $notes = [];
    while ($row = $result->fetch_assoc()) $notes[] = $row;
    echo json_encode($notes);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $title = $data['title'] ?? '';
    $content = $data['content'] ?? '';
    if (!$title || !$content) {
        http_response_code(400);
        echo json_encode(["message" => "Hiányzó adatok"]);
        exit;
    }
    $stmt = $conn->prepare("INSERT INTO patchnotes (title, content) VALUES (?, ?)");
    $stmt->bind_param("ss", $title, $content);
    $stmt->execute();
    echo json_encode(["message" => "Patch note mentve"]);
    exit;
}
?>
