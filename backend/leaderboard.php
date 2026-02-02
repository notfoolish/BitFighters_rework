<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Adatbázis hiba"]);
    exit;
}

$result = $conn->query("SELECT username, highest_score, profile_picture FROM users WHERE email_verified = 1 ORDER BY highest_score DESC LIMIT 10");
$leaderboard = [];
while ($row = $result->fetch_assoc()) {
    // Használjuk a profile_picture útvonalat, vagy alapértelmezett ha üres
    if (empty($row["profile_picture"])) {
        $row["profile_picture"] = "img/default_pfp.png";
    }
    $leaderboard[] = $row;
}

echo json_encode($leaderboard);
$conn->close();
?>
