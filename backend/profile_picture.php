<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

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

    // Fájl feltöltés kezelése
    if (!isset($_FILES['profile_picture'])) {
        http_response_code(400);
        echo json_encode(["message" => "Nincs fájl feltöltve"]);
        exit;
    }

    $file = $_FILES['profile_picture'];
    
    // Fájl validáció
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(["message" => "Csak JPEG, PNG és GIF képek engedélyezettek"]);
        exit;
    }

    // Fájlméret ellenőrzés (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(["message" => "A fájl túl nagy (max 5MB)"]);
        exit;
    }

    // Egyedi fájlnév generálása
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = $username . '_' . time() . '.' . $extension;
    $uploadDir = '../img/profiles/';
    $uploadPath = $uploadDir . $filename;

    // Debug információ
    error_log("Upload path: " . $uploadPath);
    error_log("File exists: " . (file_exists($uploadDir) ? "yes" : "no"));

    // Könyvtár létrehozása ha nem létezik
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Régi profilkép törlése
    $conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
    if (!$conn->connect_error) {
        $stmt = $conn->prepare("SELECT profile_picture FROM users WHERE username = ?");
        if ($stmt) {
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            $stmt->close();
            
            if ($user && $user['profile_picture'] && $user['profile_picture'] !== 'img/default_pfp.png') {
                $oldFile = '../' . $user['profile_picture'];
                if (file_exists($oldFile)) {
                    unlink($oldFile);
                }
            }
        }
    }

    // Fájl mozgatása
    if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
        // Adatbázis frissítése
        $relativePath = 'img/profiles/' . $filename;
        
        if ($conn->connect_error) {
            http_response_code(500);
            echo json_encode(["message" => "Adatbázis hiba"]);
            exit;
        }

        $stmt = $conn->prepare("UPDATE users SET profile_picture = ? WHERE username = ?");
        $stmt->bind_param("ss", $relativePath, $username);
        
        if ($stmt->execute()) {
            $stmt->close();
            $conn->close();
            echo json_encode([
                "message" => "Profilkép sikeresen feltöltve",
                "picture_url" => $relativePath
            ]);
        } else {
            $stmt->close();
            $conn->close();
            // Fájl törlése ha DB hiba
            unlink($uploadPath);
            http_response_code(500);
            echo json_encode(["message" => "Adatbázis frissítés sikertelen"]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Fájl feltöltés sikertelen"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Szerver hiba: " . $e->getMessage()]);
}
?>
