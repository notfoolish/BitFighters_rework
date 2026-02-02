<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function db() {
    $conn = new mysqli("mysql.rackhost.hu", "c86218BitFighter", "Alosos123", "c86218game_users");
    if ($conn->connect_error) { http_response_code(500); echo json_encode(["message" => "Adatbázis hiba: " . $conn->connect_error]); exit; }
    return $conn;
}

function authUser() {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = str_replace('Bearer ', '', $auth);
    $decoded = base64_decode($token);
    if (!$decoded) { http_response_code(401); echo json_encode(["message" => "Érvénytelen token"]); exit; }
    $parts = explode(':', $decoded);
    $username = $parts[0] ?? null;
    if (!$username) { http_response_code(401); echo json_encode(["message" => "Nincs bejelentkezve"]); exit; }
    return $username;
}

function ensureSchema($conn) {
    $conn->query("CREATE TABLE IF NOT EXISTS friend_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        requester VARCHAR(255) NOT NULL,
        receiver VARCHAR(255) NOT NULL,
        status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_req (requester, receiver),
        INDEX idx_friend_receiver_status (receiver, status, created_at),
        INDEX idx_friend_requester_status (requester, status, created_at),
        CONSTRAINT fk_friend_requester FOREIGN KEY (requester) REFERENCES users(username) ON DELETE CASCADE,
        CONSTRAINT fk_friend_receiver FOREIGN KEY (receiver) REFERENCES users(username) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $conn = db();
    ensureSchema($conn);
    $me = authUser();

    // Helper to fetch a user's public data
    $getUser = function($username) use ($conn) {
        $stmt = $conn->prepare("SELECT username, profile_picture FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $res = $stmt->get_result();
        $user = $res->fetch_assoc();
        $stmt->close();
        if (!$user) return null;
        if (empty($user['profile_picture'])) $user['profile_picture'] = 'img/default_pfp.png';
        return $user;
    };

    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'list';

        if ($action === 'incoming') {
            $stmt = $conn->prepare("SELECT requester AS username FROM friend_requests WHERE receiver = ? AND status = 'pending' ORDER BY created_at DESC");
            $stmt->bind_param("s", $me);
            $stmt->execute();
            $result = $stmt->get_result();
            $items = [];
            while ($row = $result->fetch_assoc()) { $u = $getUser($row['username']); if ($u) $items[] = $u; }
            echo json_encode($items);
            $stmt->close();
            exit;
        }

        if ($action === 'outgoing') {
            $stmt = $conn->prepare("SELECT receiver AS username FROM friend_requests WHERE requester = ? AND status = 'pending' ORDER BY created_at DESC");
            $stmt->bind_param("s", $me);
            $stmt->execute();
            $result = $stmt->get_result();
            $items = [];
            while ($row = $result->fetch_assoc()) { $u = $getUser($row['username']); if ($u) $items[] = $u; }
            echo json_encode($items);
            $stmt->close();
            exit;
        }

        // List friends (accepted both directions)
        if ($action === 'list') {
            $stmt = $conn->prepare("SELECT CASE WHEN requester = ? THEN receiver ELSE requester END AS username
                                         FROM friend_requests
                                         WHERE (requester = ? OR receiver = ?) AND status = 'accepted'");
            $stmt->bind_param("sss", $me, $me, $me);
            $stmt->execute();
            $result = $stmt->get_result();
            $items = [];
            while ($row = $result->fetch_assoc()) { $u = $getUser($row['username']); if ($u) $items[] = $u; }
            echo json_encode($items);
            $stmt->close();
            exit;
        }

        // Search users by username with relation (deduplicated)
        if ($action === 'search') {
            $q = trim($_GET['q'] ?? '');
            if ($q === '') { echo json_encode([]); exit; }
            $like = '%' . $q . '%';
            $sql = "SELECT 
                        u.username,
                        u.profile_picture,
                        CASE 
                          WHEN u.username = ? THEN 'self'
                          WHEN fr.rel_weight = 3 THEN 'friend'
                          WHEN fr.rel_weight = 2 THEN 'outgoing'
                          WHEN fr.rel_weight = 1 THEN 'incoming'
                          ELSE 'none'
                        END AS relation
                    FROM users u
                    LEFT JOIN (
                        SELECT 
                          CASE WHEN requester = ? THEN receiver ELSE requester END AS other,
                          MAX(CASE 
                                WHEN status='accepted' THEN 3
                                WHEN status='pending' AND requester = ? THEN 2
                                WHEN status='pending' AND receiver = ? THEN 1
                                ELSE 0
                              END) AS rel_weight
                        FROM friend_requests
                        WHERE requester = ? OR receiver = ?
                        GROUP BY other
                    ) fr ON fr.other = u.username
                    WHERE u.username LIKE ?
                    ORDER BY u.username ASC
                    LIMIT 10";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param('sssssss', $me, $me, $me, $me, $me, $me, $like);
            $stmt->execute();
            $res = $stmt->get_result();
            $out = [];
            while ($row = $res->fetch_assoc()) {
                if ($row['username'] === $me) continue;
                if (empty($row['profile_picture'])) $row['profile_picture'] = 'img/default_pfp.png';
                $out[] = [
                    'username' => $row['username'],
                    'profile_picture' => $row['profile_picture'],
                    'relation' => $row['relation']
                ];
            }
            $stmt->close();
            echo json_encode($out);
            exit;
        }

        http_response_code(400); echo json_encode(["message" => "Ismeretlen action"]); exit;
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $action = $input['action'] ?? '';
        $target = trim($input['username'] ?? '');

        if ($action === 'request') {
            if (!$target || strcasecmp($target, $me) === 0) { http_response_code(400); echo json_encode(["message" => "Érvénytelen célszemély"]); exit; }
            // Target létezik?
            $exists = $conn->prepare("SELECT 1 FROM users WHERE username = ?");
            $exists->bind_param("s", $target);
            $exists->execute();
            $exists->store_result();
            if ($exists->num_rows === 0) { http_response_code(404); echo json_encode(["message" => "Felhasználó nem található"]); $exists->close(); exit; }
            $exists->close();

            // Van-e már kapcsolat köztetek?
            $check = $conn->prepare("SELECT id, requester, receiver, status FROM friend_requests WHERE (requester = ? AND receiver = ?) OR (requester = ? AND receiver = ?)");
            $check->bind_param("ssss", $me, $target, $target, $me);
            $check->execute();
            $existing = $check->get_result()->fetch_assoc();
            $check->close();
            if ($existing) {
                if ($existing['status'] === 'accepted') { http_response_code(409); echo json_encode(["message" => "Már barátok vagytok"]); exit; }
                if ($existing['status'] === 'pending') { http_response_code(409); echo json_encode(["message" => "Már van függőben lévő kérelem köztetek"]); exit; }
                if ($existing['status'] === 'rejected') {
                    // Átállítás pending-re és a mostani irány beállítása
                    $upd = $conn->prepare("UPDATE friend_requests SET status = 'pending', requester = ?, receiver = ?, created_at = NOW() WHERE id = ?");
                    $upd->bind_param("ssi", $me, $target, $existing['id']);
                    if ($upd->execute()) { echo json_encode(["message" => "Kérelem elküldve"]); $upd->close(); exit; }
                    $upd->close();
                    http_response_code(500); echo json_encode(["message" => "Nem sikerült újraküldeni a kérelmet"]); exit;
                }
            }

            // Új kérelem
            $stmt = $conn->prepare("INSERT INTO friend_requests (requester, receiver, status) VALUES (?, ?, 'pending')");
            $stmt->bind_param("ss", $me, $target);
            if (!$stmt->execute()) {
                if ($stmt->errno == 1062) {
                    // Duplicate: próbáljuk meg frissíteni az előző rekordot (ha rejected volt), különben baráti v. pending info
                    $re = $conn->prepare("SELECT id, status FROM friend_requests WHERE (requester = ? AND receiver = ?) OR (requester = ? AND receiver = ?) LIMIT 1");
                    $re->bind_param("ssss", $me, $target, $target, $me);
                    $re->execute();
                    $row = $re->get_result()->fetch_assoc();
                    $re->close();
                    if ($row) {
                        if ($row['status'] === 'rejected') {
                            $upd = $conn->prepare("UPDATE friend_requests SET status = 'pending', requester = ?, receiver = ?, created_at = NOW() WHERE id = ?");
                            $upd->bind_param("ssi", $me, $target, $row['id']);
                            if ($upd->execute()) { echo json_encode(["message" => "Kérelem elküldve"]); $upd->close(); exit; }
                            $upd->close();
                        }
                        if ($row['status'] === 'accepted') { http_response_code(409); echo json_encode(["message" => "Már barátok vagytok"]); exit; }
                        if ($row['status'] === 'pending') { http_response_code(409); echo json_encode(["message" => "Már van függőben lévő kérelem köztetek"]); exit; }
                    }
                }
                http_response_code(500); echo json_encode(["message" => "Nem sikerült elküldeni a kérelmet"]); $stmt->close(); exit;
            }
            echo json_encode(["message" => "Kérelem elküldve"]);
            $stmt->close();
            exit;
        }

        if ($action === 'accept') {
            $stmt = $conn->prepare("UPDATE friend_requests SET status = 'accepted' WHERE requester = ? AND receiver = ? AND status = 'pending'");
            $stmt->bind_param("ss", $target, $me);
            if ($stmt->execute() && $stmt->affected_rows > 0) { echo json_encode(["message" => "Kérelem elfogadva"]); }
            else { http_response_code(404); echo json_encode(["message" => "Nem található ilyen kérelem"]); }
            $stmt->close();
            exit;
        }

        if ($action === 'reject') {
            $stmt = $conn->prepare("UPDATE friend_requests SET status = 'rejected' WHERE requester = ? AND receiver = ? AND status = 'pending'");
            $stmt->bind_param("ss", $target, $me);
            if ($stmt->execute() && $stmt->affected_rows > 0) { echo json_encode(["message" => "Kérelem elutasítva"]); }
            else { http_response_code(404); echo json_encode(["message" => "Nem található ilyen kérelem"]); }
            $stmt->close();
            exit;
        }

        if ($action === 'cancel') {
            $stmt = $conn->prepare("DELETE FROM friend_requests WHERE requester = ? AND receiver = ? AND status = 'pending'");
            $stmt->bind_param("ss", $me, $target);
            if ($stmt->execute() && $stmt->affected_rows > 0) { echo json_encode(["message" => "Kérelem visszavonva"]); }
            else { http_response_code(404); echo json_encode(["message" => "Nem található ilyen kérelem"]); }
            $stmt->close();
            exit;
        }

        if ($action === 'remove') {
            $stmt = $conn->prepare("DELETE FROM friend_requests WHERE status = 'accepted' AND ((requester = ? AND receiver = ?) OR (requester = ? AND receiver = ?))");
            $stmt->bind_param("ssss", $me, $target, $target, $me);
            if ($stmt->execute() && $stmt->affected_rows > 0) { echo json_encode(["message" => "Barát eltávolítva"]); }
            else { http_response_code(404); echo json_encode(["message" => "Nem vagytok barátok"]); }
            $stmt->close();
            exit;
        }

        http_response_code(400); echo json_encode(["message" => "Ismeretlen action"]); exit;
    }

    http_response_code(405); echo json_encode(["message" => "Nem támogatott metódus"]);
} catch (Exception $e) {
    http_response_code(500); echo json_encode(["message" => "Szerver hiba: " . $e->getMessage()]);
}
