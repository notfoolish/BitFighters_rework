<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');

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

    // Adatbázis kapcsolat
    $conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["message" => "Adatbázis kapcsolat hiba"]);
        exit;
    }

    // Ellenőrizzük hogy létezik-e a felhasználó és lekérjük a profilkép adatot
    $checkStmt = $conn->prepare("SELECT profile_picture FROM users WHERE username = ?");
    $checkStmt->bind_param("s", $username);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $user = $result->fetch_assoc();
    $checkStmt->close();

    if (!$user) {
        http_response_code(404);
        echo json_encode(["message" => "Felhasználó nem található"]);
        $conn->close();
        exit;
    }

    // Profilkép törlése ha van
    if ($user['profile_picture'] && $user['profile_picture'] !== 'img/default_pfp.png') {
        $profilePicPath = '../' . $user['profile_picture'];
        if (file_exists($profilePicPath)) {
            unlink($profilePicPath);
        }
    }

    // Felhasználó törlése (match_history táblát nem töröljük mert nem létezik)
    $deleteUser = $conn->prepare("DELETE FROM users WHERE username = ?");
    $deleteUser->bind_param("s", $username);
    
    if ($deleteUser->execute()) {
        $affectedRows = $deleteUser->affected_rows;
        $deleteUser->close();
        $conn->close();
        
        if ($affectedRows > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Fiók sikeresen törölve!"
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Fiók törlése sikertelen"]);
        }
    } else {
        $deleteUser->close();
        $conn->close();
        http_response_code(500);
        echo json_encode(["message" => "Adatbázis hiba a törlés során"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Szerver hiba: " . $e->getMessage()]);
}
?>
