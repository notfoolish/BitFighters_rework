-- BitFighters backend schema + sample data (MySQL)

-- Create database (optional)
-- CREATE DATABASE IF NOT EXISTS c86218game_users CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE c86218game_users;

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS app_meta;
DROP TABLE IF EXISTS friend_requests;
DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS patchnotes;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  highest_score INT NOT NULL DEFAULT 0,
  profile_picture VARCHAR(255) NULL,
  INDEX idx_users_score (highest_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  score INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_scores_user_created (username, created_at),
  INDEX idx_scores_created (created_at),
  CONSTRAINT fk_scores_user FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE patchnotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE friend_requests (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE messages (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE app_meta (
  k VARCHAR(64) PRIMARY KEY,
  v VARCHAR(255) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample users
INSERT INTO users (username, password, highest_score, profile_picture) VALUES
('PlayerOne', 'test123', 1200, 'img/default_pfp.png'),
('RetroHero', 'test123', 780, 'img/default_pfp.png'),
('CoopMaster', 'test123', 520, 'img/default_pfp.png'),
('ArenaPro', 'test123', 350, 'img/default_pfp.png'),
('Newbie', 'test123', 60, 'img/default_pfp.png'),
('admin', 'admin', 999, 'img/default_pfp.png');

-- Sample scores
INSERT INTO scores (username, score, created_at) VALUES
('PlayerOne', 1200, NOW() - INTERVAL 1 DAY),
('PlayerOne', 1100, NOW() - INTERVAL 3 DAY),
('RetroHero', 780, NOW() - INTERVAL 2 DAY),
('CoopMaster', 520, NOW() - INTERVAL 4 DAY),
('ArenaPro', 350, NOW() - INTERVAL 6 DAY),
('Newbie', 60, NOW() - INTERVAL 1 DAY);

-- Sample patchnotes
INSERT INTO patchnotes (title, content, created_at) VALUES
('Patch 1.2.0', 'Új ranglista megjelenítés és hibajavítások.', NOW() - INTERVAL 10 DAY),
('Patch 1.1.0', 'Barátlista és üzenetek funkciók.', NOW() - INTERVAL 20 DAY),
('Patch 1.0.0', 'A BitFighters hivatalos indulása.', NOW() - INTERVAL 30 DAY);

-- Sample friend requests
INSERT INTO friend_requests (requester, receiver, status, created_at) VALUES
('PlayerOne', 'RetroHero', 'accepted', NOW() - INTERVAL 7 DAY),
('CoopMaster', 'ArenaPro', 'pending', NOW() - INTERVAL 1 DAY),
('Newbie', 'PlayerOne', 'rejected', NOW() - INTERVAL 2 DAY);

-- Sample messages
INSERT INTO messages (sender, receiver, content, created_at, read_at) VALUES
('PlayerOne', 'RetroHero', 'Szia! Jössz egy meccsre?', NOW() - INTERVAL 2 HOUR, NULL),
('RetroHero', 'PlayerOne', 'Persze, 10 perc múlva!', NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 30 MINUTE),
('CoopMaster', 'ArenaPro', 'Emlékszel a tegnapi rankedre?', NOW() - INTERVAL 3 HOUR, NULL);
