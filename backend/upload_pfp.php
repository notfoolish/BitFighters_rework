<?php

header('Content-Type: application/json');
require 'db_config.php'; // A kapcsolatot a db_config.php-ből vesszük

// Ellenőrizze a felhasználó hitelesítését
// Ez egy egyszerű példa, a te rendszered a JWT tokent használja, 
// ezt a részt a meglévő auth logikádhoz kell igazítani.
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['message' => 'Nincs hitelesítési token.']);
    exit();
}

$token = $matches[1];
// Itt kellene a token validálása és a user ID kinyerése
// A következő sor csak egy helyfoglaló, a saját token validációs logikád kell ide.
$userId = validate_token($token); 
if (!$userId) {
    http_response_code(401);
    echo json_encode(['message' => 'Érvénytelen token.']);
    exit();
}

// Fájl feltöltés kezelése
if (!isset($_FILES['profile_picture'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Nincs feltöltött fájl.']);
    exit();
}

$targetDir = "../uploads/profile_pictures/";
$file = $_FILES['profile_picture'];
$fileName = basename($file["name"]);
$imageFileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
$newFileName = uniqid('pfp_') . '.' . $imageFileType;
$targetFile = $targetDir . $newFileName;

// Ellenőrzések
$check = getimagesize($file["tmp_name"]);
if ($check === false) {
    http_response_code(400);
    echo json_encode(['message' => 'A fájl nem kép.']);
    exit();
}
if ($file["size"] > 5000000) { // 5MB limit
    http_response_code(400);
    echo json_encode(['message' => 'Túl nagy a fájl.']);
    exit();
}
if (!in_array($imageFileType, ['jpg', 'png', 'jpeg', 'gif'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Csak JPG, JPEG, PNG & GIF fájlok engedélyezettek.']);
    exit();
}

// Mappa létrehozása, ha nem létezik
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

// Fájl mentése
if (!move_uploaded_file($file["tmp_name"], $targetFile)) {
    http_response_code(500);
    echo json_encode(['message' => 'Hiba történt a fájl feltöltése során.']);
    exit();
}

// Adatbázis frissítése
$profilePicturePath = "uploads/profile_pictures/" . $newFileName;
$sql = "UPDATE users SET profile_picture = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $profilePicturePath, $userId);

if ($stmt->execute()) {
    echo json_encode([
        'message' => 'Profilkép sikeresen frissítve!',
        'profile_picture_url' => $profilePicturePath,
    ]);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Adatbázis hiba: ' . $stmt->error]);
}

$stmt->close();
$conn->close();

function validate_token($token) {
    // Ide tedd a JWT token ellenőrző logikádat.
    // Pl. require 'vendor/autoload.php';
    // use Firebase\JWT\JWT;
    // use Firebase\JWT\Key;
    // ...
    // try {
    //    $decoded = JWT::decode($token, new Key('a-sajat-kulcsod', 'HS256'));
    //    return $decoded->user_id;
    // } catch (Exception $e) {
    //    return false;
    // }
    return 1; // Átmenetileg 1-es ID-t ad vissza tesztelésre.
}
?>
