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
    // ensure proper charset for emojis and non-ASCII
    if (method_exists($conn, 'set_charset')) { @$conn->set_charset('utf8mb4'); }
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
    // messages tábla + indexek (idx_created benne van a CREATE-ben)
    $conn->query("CREATE TABLE IF NOT EXISTS messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        sender VARCHAR(255) NOT NULL,
        receiver VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_pair_created (sender, receiver, created_at),
        INDEX idx_revpair_created (receiver, sender, created_at),
        INDEX idx_receiver_read (receiver, read_at),
        INDEX idx_created (created_at),
        CONSTRAINT fk_messages_sender FOREIGN KEY (sender) REFERENCES users(username) ON DELETE CASCADE,
        CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver) REFERENCES users(username) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // app_meta tábla a legutóbbi takarítás idejének tárolására
    $conn->query("CREATE TABLE IF NOT EXISTS app_meta (
        k VARCHAR(64) PRIMARY KEY,
        v VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // opcionális MySQL EVENT a napi takarításhoz (ha engedélyezett a szerveren)
    try {
        $conn->query("CREATE EVENT IF NOT EXISTS message_retention_90d
            ON SCHEDULE EVERY 1 DAY
            DO DELETE FROM messages WHERE created_at < (NOW() - INTERVAL 90 DAY)");
    } catch (Throwable $e) {
        // ignore if EVENTs are not allowed
    }
}

function maybeCleanup($conn) {
    // Futtassuk legfeljebb 6 óránként, és egyszerre max 5000 sort törlünk, hogy gyors legyen a kérés
    $due = true;
    if ($res = $conn->query("SELECT (updated_at < (NOW() - INTERVAL 6 HOUR)) AS due FROM app_meta WHERE k='messages_last_cleanup' LIMIT 1")) {
        if ($row = $res->fetch_assoc()) { $due = intval($row['due']) === 1; }
        $res->close();
    }
    if ($due) {
        // törlés 90 napnál régebbi üzenetekre
        $conn->query("DELETE FROM messages WHERE created_at < (NOW() - INTERVAL 90 DAY) LIMIT 5000");
        // upsert meta jelző
        $conn->query("INSERT INTO app_meta (k, v) VALUES ('messages_last_cleanup', NOW())
                      ON DUPLICATE KEY UPDATE v=VALUES(v), updated_at=CURRENT_TIMESTAMP");
    }
}

function cleanupAll($conn) {
    $total = 0;
    do {
        $conn->query("DELETE FROM messages WHERE created_at < (NOW() - INTERVAL 90 DAY) LIMIT 20000");
        $aff = $conn->affected_rows;
        $total += max(0, $aff);
    } while ($aff > 0);
    // meta frissítés
    $conn->query("INSERT INTO app_meta (k, v) VALUES ('messages_last_cleanup', NOW())
                  ON DUPLICATE KEY UPDATE v=VALUES(v), updated_at=CURRENT_TIMESTAMP");
    return $total;
}

function areFriends($conn, $a, $b) {
    $sql = "SELECT 1 FROM friend_requests WHERE status='accepted' AND ((requester=? AND receiver=?) OR (requester=? AND receiver=?)) LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ssss', $a, $b, $b, $a);
    $stmt->execute();
    $stmt->store_result();
    $ok = $stmt->num_rows > 0;
    $stmt->close();
    return $ok;
}

try {
    $conn = db();
    ensureSchema($conn);
    $me = authUser();
    // 90 napos retention: időszakos takarítás
    maybeCleanup($conn);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? '';

        if ($action === 'thread') {
            $other = trim($_GET['user'] ?? '');
            if ($other === '') { http_response_code(400); echo json_encode(["message" => "Hiányzó felhasználó"]); exit; }
            if (!areFriends($conn, $me, $other)) { http_response_code(403); echo json_encode(["message" => "Nem vagytok barátok"]); exit; }

            $sinceId = isset($_GET['since_id']) ? intval($_GET['since_id']) : 0;
            if ($sinceId > 0) {
                $sql = "SELECT id, sender, receiver, content, UNIX_TIMESTAMP(created_at) AS ts, read_at IS NOT NULL AS `read`
                        FROM messages
                        WHERE id > ? AND ((sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?))
                        ORDER BY id ASC
                        LIMIT 200";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param('issss', $sinceId, $me, $other, $other, $me);
            } else {
                $sql = "SELECT id, sender, receiver, content, UNIX_TIMESTAMP(created_at) AS ts, read_at IS NOT NULL AS `read`
                        FROM messages
                        WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
                        ORDER BY id DESC
                        LIMIT 100";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param('ssss', $me, $other, $other, $me);
            }
            $stmt->execute();
            $res = $stmt->get_result();
            $rows = [];
            while ($r = $res->fetch_assoc()) { $rows[] = $r; }
            $stmt->close();
            if ($sinceId === 0) { $rows = array_reverse($rows); }
            $lastId = $sinceId;
            foreach ($rows as $r) { if ($r['id'] > $lastId) $lastId = $r['id']; }
            echo json_encode([ 'me' => $me, 'messages' => $rows, 'last_id' => $lastId ]);
            exit;
        }

        if ($action === 'unread') {
            $from = trim($_GET['from'] ?? '');
            if ($from !== '') {
                $stmt = $conn->prepare("SELECT COUNT(*) c FROM messages WHERE receiver=? AND sender=? AND read_at IS NULL");
                $stmt->bind_param('ss', $me, $from);
                $stmt->execute();
                $c = $stmt->get_result()->fetch_assoc()['c'] ?? 0;
                $stmt->close();
                echo json_encode([ 'from' => $from, 'count' => intval($c) ]);
                exit;
            }
            $stmt = $conn->prepare("SELECT sender, COUNT(*) c FROM messages WHERE receiver=? AND read_at IS NULL GROUP BY sender");
            $stmt->bind_param('s', $me);
            $stmt->execute();
            $res = $stmt->get_result();
            $out = [];
            while ($r = $res->fetch_assoc()) { $out[$r['sender']] = intval($r['c']); }
            $stmt->close();
            echo json_encode($out);
            exit;
        }

        http_response_code(400); echo json_encode(["message" => "Ismeretlen action"]); exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $action = $data['action'] ?? '';

        if ($action === 'send') {
            $to = trim($data['to'] ?? '');
            $content = trim($data['content'] ?? '');
            if ($to === '' || $content === '') { http_response_code(400); echo json_encode(["message" => "Hiányzó adatok"]); exit; }
            if (mb_strlen($content) > 2000) { http_response_code(413); echo json_encode(["message" => "Túl hosszú üzenet (max 2000)"]); exit; }
            if (!areFriends($conn, $me, $to)) { http_response_code(403); echo json_encode(["message" => "Nem vagytok barátok"]); exit; }

            $stmt = $conn->prepare("INSERT INTO messages (sender, receiver, content) VALUES (?, ?, ?)");
            $stmt->bind_param('sss', $me, $to, $content);
            if (!$stmt->execute()) { http_response_code(500); echo json_encode(["message" => "Nem sikerült elküldeni az üzenetet"]); $stmt->close(); exit; }
            $id = $stmt->insert_id; $stmt->close();
            echo json_encode([ 'message' => 'OK', 'id' => intval($id) ]);
            exit;
        }

        if ($action === 'mark_read') {
            $from = trim($data['from'] ?? '');
            if ($from === '') { http_response_code(400); echo json_encode(["message" => "Hiányzó felhasználó"]); exit; }
            $stmt = $conn->prepare("UPDATE messages SET read_at = NOW() WHERE receiver = ? AND sender = ? AND read_at IS NULL");
            $stmt->bind_param('ss', $me, $from);
            $stmt->execute();
            $aff = $stmt->affected_rows; $stmt->close();
            echo json_encode([ 'updated' => intval($aff) ]);
            exit;
        }

        if ($action === 'cleanup') {
            // csak admin
            if ($me !== 'admin') { http_response_code(403); echo json_encode([ 'message' => 'Nincs jogosultság' ]); exit; }
            $deleted = cleanupAll($conn);
            echo json_encode([ 'deleted' => intval($deleted) ]);
            exit;
        }

        http_response_code(400); echo json_encode(["message" => "Ismeretlen action"]); exit;
    }

    http_response_code(405); echo json_encode(["message" => "Nem támogatott metódus"]);

} catch (Exception $e) {
    http_response_code(500); echo json_encode(["message" => "Szerver hiba: " . $e->getMessage()]);
}
