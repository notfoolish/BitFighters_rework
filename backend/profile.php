<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// OPTIONS request kezelése
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
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
        echo json_encode(["message" => "Nincs bejelentkezve"]);
        exit;
    }

    $conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["message" => "Adatbázis kapcsolat hiba: " . $conn->connect_error]);
        exit;
    }

    $stmt = $conn->prepare("SELECT username, highest_score, profile_picture FROM users WHERE username = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["message" => "SQL statement hiba: " . $conn->error]);
        exit;
    }
    
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        http_response_code(404);
        echo json_encode(["message" => "Felhasználó nem található: " . $username]);
        exit;
    }

    // Alapértelmezett profilkép beállítása
    if (empty($user['profile_picture'])) {
        $user['profile_picture'] = 'img/default_pfp.png';
    }

    // Rangszám kiszámítása a highest_score alapján
    $rankStmt = $conn->prepare("SELECT COUNT(*) + 1 as rank FROM users WHERE highest_score > ?");
    if ($rankStmt) {
        $rankStmt->bind_param("i", $user['highest_score']);
        $rankStmt->execute();
        $rankResult = $rankStmt->get_result();
        $rankData = $rankResult->fetch_assoc();
        $user['rank'] = $rankData['rank'];
        $rankStmt->close();
    } else {
        $user['rank'] = 1; // Fallback
    }

    // score alias hozzáadása a kompatibilitásért
    $user['score'] = $user['highest_score'];

    echo json_encode($user);
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Szerver hiba: " . $e->getMessage()]);
}
?>
