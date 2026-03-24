-- ============================================================
-- 海蝕機関 ARG — Turso (libSQL) スキーマ
-- turso db shell <your-db-name> < scripts/schema.sql で実行
-- ============================================================

PRAGMA foreign_keys = ON;

-- ── ユーザー ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                     TEXT    PRIMARY KEY,
  agent_id               TEXT    NOT NULL UNIQUE,
  username               TEXT    NOT NULL UNIQUE,
  password_hash          TEXT    NOT NULL DEFAULT '',
  email                  TEXT,
  display_name           TEXT,
  division_id            TEXT,
  role                   TEXT    NOT NULL DEFAULT 'player',
  status                 TEXT    NOT NULL DEFAULT 'active',
  clearance_level        INTEGER NOT NULL DEFAULT 0,
  xp_total               INTEGER NOT NULL DEFAULT 0,
  anomaly_score          REAL    NOT NULL DEFAULT 0,
  observer_load          REAL    NOT NULL DEFAULT 0,
  consecutive_login_days INTEGER NOT NULL DEFAULT 0,
  last_login_at          TEXT,
  login_count            INTEGER NOT NULL DEFAULT 0,
  secret_question        TEXT,
  secret_answer_hash     TEXT,
  created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
  password_changed_at    TEXT,
  FOREIGN KEY (division_id) REFERENCES divisions(id)
);

-- ── 部門 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS divisions (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  description TEXT,
  color       TEXT
);

-- ── チャットメッセージ ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          TEXT PRIMARY KEY,
  chat_id     TEXT NOT NULL,
  sender_id   TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  text        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'user',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created
  ON chat_messages(chat_id, created_at DESC);

-- ── チャット既読マーカー ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_read_markers (
  user_id          TEXT NOT NULL,
  chat_id          TEXT NOT NULL,
  last_read_msg_id TEXT NOT NULL,
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, chat_id)
);

-- ── 通知 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT    PRIMARY KEY,
  user_id    TEXT    NOT NULL,
  type       TEXT    NOT NULL,
  title      TEXT    NOT NULL,
  body       TEXT,
  is_read    INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

-- ── XPログ ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_logs (
  id         TEXT    PRIMARY KEY,
  user_id    TEXT    NOT NULL,
  activity   TEXT    NOT NULL,
  xp_gained  INTEGER NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_xp_logs_user_activity
  ON xp_logs(user_id, activity, created_at DESC);

-- ── ストーリーフラグ ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_flags (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  flag_key   TEXT NOT NULL,
  flag_value TEXT NOT NULL DEFAULT 'true',
  set_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, flag_key),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ── 発火済みイベント ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fired_events (
  id       TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL,
  event_id TEXT NOT NULL,
  fired_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ── レートリミット試行ログ ────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id           TEXT    PRIMARY KEY,
  key_type     TEXT    NOT NULL,
  key_value    TEXT    NOT NULL,
  success      INTEGER NOT NULL DEFAULT 0,
  attempted_at TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at   TEXT    NOT NULL DEFAULT (datetime('now', '+24 hours'))  -- TTL: cronで削除
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_key_time
  ON rate_limit_attempts(key_type, key_value, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_expires
  ON rate_limit_attempts(expires_at);  -- cronによるTTL削除の高速化

-- ── アクセスログ ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_logs (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT,
  method      TEXT    NOT NULL,
  path        TEXT    NOT NULL,
  status_code INTEGER,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── ルールエンジン ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rule_engine_entries (
  id         TEXT    PRIMARY KEY,
  type       TEXT    NOT NULL,
  active     INTEGER NOT NULL DEFAULT 1,
  priority   INTEGER NOT NULL DEFAULT 0,
  data_json  TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- シードデータ
-- ============================================================

-- 部門マスターデータ
INSERT OR IGNORE INTO divisions (id, name, name_en, description, color) VALUES
  ('DIV-01', '観測部門',   'OBSERVATION DIVISION',  '海蝕現象の発生源を特定・記録する。機関の目となる存在。',              '#00C8FF'),
  ('DIV-02', '収束部門',   'CONVERGENCE DIVISION',  '侵食を中和し、次元の歪みを収束させる最前線部隊。',                    '#A064FF'),
  ('DIV-03', '記録部門',   'ARCHIVE DIVISION',      '全ての現象・事例を記録・分類・保管する機関の記憶。',                  '#50DC78'),
  ('DIV-04', '技術部門',   'ENGINEERING DIVISION',  '観測・収束機器の開発・保守を担う。機関のインフラを支える。',          '#FFB43C'),
  ('DIV-05', '封印部門',   'CONTAINMENT DIVISION',  '次元裂孔を封印し、侵食源を隔離する。機密度最高の部門。',              '#FF6B6B');

-- NPCユーザー（システム予約アカウント）
INSERT OR IGNORE INTO users
  (id, agent_id, username, password_hash, role, status, clearance_level)
VALUES
  ('npc-00000001-echo-0000-0000-000000000000', 'K-ECHO', 'K-ECHO', '', 'npc', 'active', 5),
  ('npc-00000002-veil-0000-0000-000000000000', 'N-VEIL', 'N-VEIL', '', 'npc', 'active', 5),
  ('npc-00000003-rift-0000-0000-000000000000', 'L-RIFT', 'L-RIFT', '', 'npc', 'active', 5),
  ('npc-00000004-phos-0000-0000-000000000000', 'A-PHOS', 'A-PHOS', '', 'npc', 'active', 5),
  ('npc-00000005-mist-0000-0000-000000000000', 'G-MIST', 'G-MIST', '', 'npc', 'active', 5);

-- 管理者アカウント（password_hash は migrate.js --admin-password で上書きされる）
-- password_hash の空文字はログイン不可を意味する（bcrypt.compare が常に false）
INSERT OR IGNORE INTO users
  (id, agent_id, username, password_hash, role, status, clearance_level, xp_total)
VALUES
  ('admin-00000000-0000-0000-0000-000000000000', 'K-000-ADMIN', 'K-000-ADMIN', '', 'admin', 'active', 5, 99999);

-- ── ブックマーク ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id            TEXT    PRIMARY KEY,
  user_id       TEXT    NOT NULL,
  target_type   TEXT    NOT NULL,  -- 'entity', 'mission', 'document' など
  target_id     TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, target_type, target_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user
  ON bookmarks(user_id, created_at DESC);

-- ── 実績マスター ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id           TEXT    PRIMARY KEY,
  key          TEXT    NOT NULL UNIQUE,  -- "streak_7days", "level5_reached" 等
  title        TEXT    NOT NULL,
  description  TEXT    NOT NULL,
  icon         TEXT,
  xp_reward    INTEGER NOT NULL DEFAULT 0,
  is_secret    INTEGER NOT NULL DEFAULT 0
);

-- ── ユーザー実績 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  earned_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, achievement_id),
  FOREIGN KEY (user_id)        REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user
  ON user_achievements(user_id, earned_at DESC);

-- ── ミッション ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS missions (
  id                TEXT    PRIMARY KEY,
  title             TEXT    NOT NULL,
  description       TEXT,
  category          TEXT    NOT NULL DEFAULT 'standard',
  status            TEXT    NOT NULL DEFAULT 'active',
  required_level    INTEGER NOT NULL DEFAULT 2,
  xp_reward         INTEGER NOT NULL DEFAULT 100,
  phase             INTEGER NOT NULL DEFAULT 1,
  assigned_division TEXT,
  issued_by         TEXT,
  issued_at         TEXT    NOT NULL DEFAULT (datetime('now')),
  deadline_at       TEXT
);

-- ── ユーザー設定 ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id              TEXT    PRIMARY KEY,
  -- 通知設定
  notify_xp            INTEGER NOT NULL DEFAULT 1,
  notify_levelup       INTEGER NOT NULL DEFAULT 1,
  notify_mission       INTEGER NOT NULL DEFAULT 1,
  notify_chat          INTEGER NOT NULL DEFAULT 1,
  notify_system        INTEGER NOT NULL DEFAULT 1,
  -- プライバシー設定
  privacy_show_activity INTEGER NOT NULL DEFAULT 1,  -- 活動履歴を他ユーザーに公開
  privacy_show_division INTEGER NOT NULL DEFAULT 1,  -- 所属部門を公開
  updated_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ── 掲示板投稿 ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  title        TEXT    NOT NULL,
  body         TEXT    NOT NULL,
  category     TEXT    NOT NULL DEFAULT 'general',  -- 'general', 'report', 'request'
  is_pinned    INTEGER NOT NULL DEFAULT 0,
  is_deleted   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_posts_created
  ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category
  ON posts(category, created_at DESC);

-- ── スキルツリー解放状態 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_skill_nodes (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  node_id     TEXT    NOT NULL,   -- スキルノードのID（静的定義）
  unlocked_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, node_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_user_skill_nodes_user
  ON user_skill_nodes(user_id);

-- ── スキルテスト結果 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_exam_results (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  skill_id     TEXT    NOT NULL,
  score        INTEGER NOT NULL,   -- 正解数
  total        INTEGER NOT NULL,   -- 総問題数
  passed       INTEGER NOT NULL DEFAULT 0,  -- 合格判定 (1=合格)
  taken_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, skill_id),       -- 1スキル1記録（上書き）
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_skill_exam_user
  ON skill_exam_results(user_id, skill_id);

-- ── ミッション参加申請 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mission_participants (
  id          TEXT    PRIMARY KEY,
  mission_id  TEXT    NOT NULL,
  user_id     TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'pending', -- pending / approved / rejected / completed
  applied_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  completed_at TEXT,
  note        TEXT,
  UNIQUE (mission_id, user_id),
  FOREIGN KEY (mission_id) REFERENCES missions(id),
  FOREIGN KEY (user_id)    REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_mission_participants_user
  ON mission_participants(user_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_mission_participants_mission
  ON mission_participants(mission_id, status);

-- ── コンテンツ公開スケジュール ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS publish_queue (
  id             TEXT    PRIMARY KEY,
  content_type   TEXT    NOT NULL,
  content_id     TEXT    NOT NULL,
  title          TEXT    NOT NULL,
  publish_at     TEXT    NOT NULL,
  status         TEXT    NOT NULL DEFAULT 'scheduled',
  notify_target  TEXT,
  notify_title   TEXT,
  notify_body    TEXT,
  flag_key       TEXT,
  flag_value     TEXT    NOT NULL DEFAULT 'true',
  created_by     TEXT    NOT NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  published_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_publish_queue_status_at
  ON publish_queue(status, publish_at);

-- ── 公開済みコンテンツ記録 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS published_content (
  content_type TEXT NOT NULL,
  content_id   TEXT NOT NULL,
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (content_type, content_id)
);

-- ── ARGイベントスケジューラー ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_schedule (
  id            TEXT    PRIMARY KEY,
  title         TEXT    NOT NULL,
  description   TEXT,
  trigger_at    TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'scheduled',
  actions_json  TEXT    NOT NULL DEFAULT '[]',
  created_by    TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  fired_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_event_schedule_status_at
  ON event_schedule(status, trigger_at);

-- ── 謎コンテンツ（暗号解読パズル） ──────────────────────────────────
CREATE TABLE IF NOT EXISTS puzzle_entries (
  id            TEXT    PRIMARY KEY,
  slug          TEXT    NOT NULL UNIQUE,
  title         TEXT    NOT NULL,
  cipher_text   TEXT    NOT NULL,
  answer        TEXT    NOT NULL,
  hint          TEXT,
  xp_reward     INTEGER NOT NULL DEFAULT 50,
  clearance_req INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_by    TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── 謎解き正解履歴 ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS puzzle_solves (
  id         TEXT PRIMARY KEY,
  puzzle_id  TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  solved_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (puzzle_id, user_id),
  FOREIGN KEY (puzzle_id) REFERENCES puzzle_entries(id),
  FOREIGN KEY (user_id)   REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_puzzle_solves_user
  ON puzzle_solves(user_id, solved_at DESC);

-- ── NPC個別DMチャンネル ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS npc_dm_channels (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  npc_name   TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, npc_name),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_npc_dm_channels_user
  ON npc_dm_channels(user_id);

-- ── Web Push 購読情報 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  user_agent   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions(user_id);

-- ── story_variables ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS story_variables (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL,
  var_key   TEXT NOT NULL,
  var_value REAL NOT NULL DEFAULT 0,
  UNIQUE (user_id, var_key),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_story_variables_user
  ON story_variables(user_id, var_key);

-- ── コンテンツ管理（小説・コーデックス DB化） ──────────────────────
CREATE TABLE IF NOT EXISTS content_entries (
  id             TEXT    PRIMARY KEY,
  content_type   TEXT    NOT NULL,  -- 'novel' | 'codex'
  content_id     TEXT    NOT NULL,  -- 'DIARY-008', 'codex-new-001' など
  title          TEXT    NOT NULL,
  subtitle       TEXT,
  category       TEXT,
  clearance_req  INTEGER NOT NULL DEFAULT 0,
  author         TEXT,
  date_label     TEXT,
  body           TEXT    NOT NULL DEFAULT '',
  is_published   INTEGER NOT NULL DEFAULT 0,
  created_by     TEXT    NOT NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (content_type, content_id)
);
CREATE INDEX IF NOT EXISTS idx_content_entries_type_clearance
  ON content_entries(content_type, clearance_req, is_published);

-- ── NPC エンジン動的ルール（デプロイなしで更新可能） ─────────────────
CREATE TABLE IF NOT EXISTS npc_engine_rules (
  id          TEXT    PRIMARY KEY,
  active      INTEGER NOT NULL DEFAULT 1,
  priority    INTEGER NOT NULL DEFAULT 0,
  data_json   TEXT    NOT NULL DEFAULT '{}',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_npc_engine_rules_active_priority
  ON npc_engine_rules(active, priority DESC);

-- ═══════════════════════════════════════════════════════════════════
-- 静的データ DB 移行テーブル群
-- ═══════════════════════════════════════════════════════════════════

-- ── 実体カタログ ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS db_entities (
  id                   TEXT PRIMARY KEY,
  designation          TEXT NOT NULL,
  code                 TEXT NOT NULL UNIQUE,
  threat               TEXT NOT NULL DEFAULT 'UNKNOWN',
  clearance            INTEGER NOT NULL DEFAULT 1,
  status               TEXT NOT NULL DEFAULT 'OBSERVED',
  classification       TEXT NOT NULL DEFAULT 'unknown',
  description          TEXT NOT NULL DEFAULT '',
  first_detected       TEXT NOT NULL DEFAULT '',
  neutralized          INTEGER,
  containment_protocol TEXT NOT NULL DEFAULT '',
  observed_abilities   TEXT NOT NULL DEFAULT '[]',
  related_entities     TEXT NOT NULL DEFAULT '[]',
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_db_entities_clearance ON db_entities(clearance, threat);

-- ── 施設データベース ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS db_facilities (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  code                TEXT NOT NULL UNIQUE,
  location            TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'OPERATIONAL',
  clearance           INTEGER NOT NULL DEFAULT 1,
  type                TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  staff               INTEGER,
  established         TEXT NOT NULL DEFAULT '',
  equipment_installed TEXT NOT NULL DEFAULT '[]',
  divisions_present   TEXT NOT NULL DEFAULT '[]',
  notes               TEXT NOT NULL DEFAULT '',
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 装備データベース ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS db_equipment (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  code              TEXT NOT NULL UNIQUE,
  category          TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'IN_SERVICE',
  clearance         INTEGER NOT NULL DEFAULT 1,
  quantity          INTEGER,
  description       TEXT NOT NULL DEFAULT '',
  weight            TEXT NOT NULL DEFAULT '',
  issued_by         TEXT NOT NULL DEFAULT '',
  specifications    TEXT NOT NULL DEFAULT '{}',
  maintenance_cycle TEXT NOT NULL DEFAULT '',
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 人事データベース ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS db_personnel (
  id                  TEXT PRIMARY KEY,
  codename            TEXT NOT NULL,
  real_name           TEXT NOT NULL DEFAULT '',
  role                TEXT NOT NULL DEFAULT '',
  division            TEXT NOT NULL DEFAULT '',
  clearance           INTEGER NOT NULL DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'ACTIVE',
  joined              TEXT NOT NULL DEFAULT '',
  last_seen           TEXT NOT NULL DEFAULT '—',
  specialization      TEXT NOT NULL DEFAULT '',
  notes               TEXT NOT NULL DEFAULT '',
  anomaly_score       REAL,
  missions_completed  INTEGER,
  commendations       TEXT NOT NULL DEFAULT '[]',
  incident_flags      TEXT NOT NULL DEFAULT '[]',
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_db_personnel_clearance ON db_personnel(clearance);

-- ── 記録文書（小説） ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novel_documents (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  clearance   INTEGER NOT NULL DEFAULT 0,
  category    TEXT NOT NULL DEFAULT '日記',
  date        TEXT NOT NULL DEFAULT '',
  author      TEXT NOT NULL DEFAULT '',
  content     TEXT NOT NULL DEFAULT '',
  is_published INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_novel_clearance ON novel_documents(clearance, is_published);

-- ── コーデックスセクション ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS codex_sections (
  id        TEXT PRIMARY KEY,
  label     TEXT NOT NULL,
  title     TEXT NOT NULL,
  icon      TEXT NOT NULL DEFAULT '◈',
  color     TEXT NOT NULL DEFAULT 'var(--color-primary)',
  clearance INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ── コーデックスエントリ ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS codex_entries (
  id         TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  title      TEXT NOT NULL,
  subtitle   TEXT,
  body       TEXT NOT NULL DEFAULT '',
  clearance  INTEGER NOT NULL DEFAULT 0,
  tags       TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (section_id) REFERENCES codex_sections(id)
);
CREATE INDEX IF NOT EXISTS idx_codex_entries_section ON codex_entries(section_id, clearance);

-- ── フィールドインシデント ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS field_incidents (
  id         TEXT PRIMARY KEY,
  severity   TEXT NOT NULL DEFAULT 'warning',
  status     TEXT NOT NULL DEFAULT '監視中',
  name       TEXT NOT NULL,
  lon        REAL NOT NULL DEFAULT 0,
  lat        REAL NOT NULL DEFAULT 0,
  location   TEXT NOT NULL DEFAULT '',
  entity     TEXT NOT NULL DEFAULT '',
  gsi        REAL NOT NULL DEFAULT 0,
  division   TEXT NOT NULL DEFAULT '',
  desc       TEXT NOT NULL DEFAULT '',
  time       TEXT NOT NULL DEFAULT (datetime('now')),
  city_code  TEXT,
  city_name  TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_field_incidents_severity ON field_incidents(severity, status);

-- ── メール認証 OTP（登録用） ─────────────────────────────────────────
-- rate_limit_attempts を流用せず専用テーブルで管理
CREATE TABLE IF NOT EXISTS email_verifications (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  otp         TEXT    NOT NULL,
  expires_at  TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user
  ON email_verifications(user_id);

-- ── 音声記録（小説タグ [[AUD-XXX]] 用） ──────────────────────────────
CREATE TABLE IF NOT EXISTS audio_records (
  id              TEXT    PRIMARY KEY,          -- AUD-001, REC-2026-0313-K17 等
  title           TEXT    NOT NULL,             -- 表示名
  filename        TEXT    NOT NULL,             -- ファイル名表示用（実ファイルは不要）
  duration_sec    INTEGER NOT NULL DEFAULT 0,   -- 秒数
  recorded_at     TEXT    NOT NULL DEFAULT '',  -- "YYYY-MM-DD HH:MM"
  recorded_by     TEXT    NOT NULL DEFAULT '',  -- AGT-K17 等
  location_ref    TEXT,                         -- INC-007 等（任意）
  classification  TEXT    NOT NULL DEFAULT 'safe',  -- safe / restricted / classified
  clearance_req   INTEGER NOT NULL DEFAULT 0,
  voice_detected  INTEGER NOT NULL DEFAULT 1,   -- 0=STATIC（発話なし）
  integrity       INTEGER NOT NULL DEFAULT 100, -- 0–100%（<100でCORRUPTED演出）
  transcript_json TEXT    NOT NULL DEFAULT '[]',-- [{time:"00:04",text:"…",corrupted?:true}]
  gsi_value       REAL,                         -- STATIC時の異常GSI値
  entity_ref      TEXT,                         -- ENT-001 等（任意）
  notes           TEXT,
  created_by      TEXT    NOT NULL DEFAULT 'system',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audio_records_clearance
  ON audio_records(clearance_req, classification);

-- ══════════════════════════════════════════════════════════════════════
-- タグシステム拡張テーブル群（Phase 5 追加分）
-- Updated: 2026-03-23
-- ══════════════════════════════════════════════════════════════════════

-- ── 観測地点（LOC- / RIFT-） ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS observation_points (
  id            TEXT    PRIMARY KEY,   -- LOC-OIT-001 / RIFT-α7
  type          TEXT    NOT NULL,      -- 'location' | 'rift_point'
  name          TEXT    NOT NULL,
  name_short    TEXT    NOT NULL DEFAULT '',
  lon           REAL    NOT NULL DEFAULT 0,
  lat           REAL    NOT NULL DEFAULT 0,
  city_code     TEXT,
  city_name     TEXT,
  status        TEXT    NOT NULL DEFAULT 'active',
  clearance_req INTEGER NOT NULL DEFAULT 0,
  gsi_current   REAL,
  description   TEXT    NOT NULL DEFAULT '',
  notes         TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_obs_points_type ON observation_points(type, clearance_req);

-- ── 観測ログ（GSI- / SIG- / SCAN-） ──────────────────────────────────
CREATE TABLE IF NOT EXISTS observation_logs (
  id            TEXT    PRIMARY KEY,   -- GSI-RECORD-042 / SIG-DELTA / SCAN-2026-0313
  type          TEXT    NOT NULL,      -- 'gsi' | 'signal' | 'scan'
  title         TEXT    NOT NULL,
  observed_at   TEXT    NOT NULL,
  location_ref  TEXT,
  entity_ref    TEXT,
  clearance_req INTEGER NOT NULL DEFAULT 0,
  gsi_value     REAL,
  gsi_baseline  REAL,
  freq_band     TEXT,
  amplitude_db  REAL,
  duration_sec  INTEGER,
  pattern_match TEXT,
  scan_area     TEXT,
  findings_json TEXT    NOT NULL DEFAULT '[]',
  severity      TEXT    NOT NULL DEFAULT 'normal',
  description   TEXT    NOT NULL DEFAULT '',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_obs_logs_type ON observation_logs(type, severity);

-- ── 次元裂孔（CRK-） ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dimension_cracks (
  id              TEXT    PRIMARY KEY,  -- CRK-001
  name            TEXT    NOT NULL,
  lon             REAL    NOT NULL DEFAULT 0,
  lat             REAL    NOT NULL DEFAULT 0,
  location        TEXT    NOT NULL DEFAULT '',
  status          TEXT    NOT NULL DEFAULT 'active',
  severity        TEXT    NOT NULL DEFAULT 'warning',
  gsi_peak        REAL,
  first_detected  TEXT    NOT NULL DEFAULT '',
  sealed_at       TEXT,
  entity_emerged  TEXT    NOT NULL DEFAULT '[]',
  clearance_req   INTEGER NOT NULL DEFAULT 0,
  description     TEXT    NOT NULL DEFAULT '',
  notes           TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── 機関員メモ（MEMO-） ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_memos (
  id            TEXT    PRIMARY KEY,  -- MEMO-K17-001
  title         TEXT    NOT NULL,
  author_ref    TEXT    NOT NULL,
  location_ref  TEXT,
  written_at    TEXT    NOT NULL DEFAULT '',
  found_at      TEXT,
  found_by      TEXT,
  status        TEXT    NOT NULL DEFAULT 'recovered',
  clearance_req INTEGER NOT NULL DEFAULT 0,
  content       TEXT    NOT NULL DEFAULT '',
  tags_json     TEXT    NOT NULL DEFAULT '[]',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── 事案記録（CASE-IR-） ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_reports (
  id              TEXT    PRIMARY KEY,  -- CASE-IR-031
  title           TEXT    NOT NULL,
  case_date       TEXT    NOT NULL,
  closed_date     TEXT,
  status          TEXT    NOT NULL DEFAULT 'closed',
  division_ref    TEXT,
  personnel_json  TEXT    NOT NULL DEFAULT '[]',
  entity_ref      TEXT,
  location_ref    TEXT,
  casualties      INTEGER NOT NULL DEFAULT 0,
  clearance_req   INTEGER NOT NULL DEFAULT 0,
  summary         TEXT    NOT NULL DEFAULT '',
  full_report     TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_case_reports_clearance ON case_reports(clearance_req, status);

-- ── 作戦記録（OP-） ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operation_records (
  id             TEXT    PRIMARY KEY,  -- OP-NIGHTFALL
  codename       TEXT    NOT NULL,
  title          TEXT    NOT NULL,
  op_date        TEXT    NOT NULL,
  end_date       TEXT,
  status         TEXT    NOT NULL DEFAULT 'completed',
  division_json  TEXT    NOT NULL DEFAULT '[]',
  commander_ref  TEXT,
  target_ref     TEXT,
  location_ref   TEXT,
  outcome        TEXT    NOT NULL DEFAULT '',
  clearance_req  INTEGER NOT NULL DEFAULT 0,
  description    TEXT    NOT NULL DEFAULT '',
  casualties     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── 封印プロトコル（PROTO-） ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS containment_protocols (
  id            TEXT    PRIMARY KEY,  -- PROTO-OMEGA
  codename      TEXT    NOT NULL,
  title         TEXT    NOT NULL,
  division_ref  TEXT,
  status        TEXT    NOT NULL DEFAULT 'active',
  threat_class  TEXT    NOT NULL DEFAULT '',
  clearance_req INTEGER NOT NULL DEFAULT 0,
  summary       TEXT    NOT NULL DEFAULT '',
  steps_json    TEXT    NOT NULL DEFAULT '[]',
  warnings      TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── 研究仮説（THEORY-） ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS research_theories (
  id             TEXT    PRIMARY KEY,  -- THEORY-009
  title          TEXT    NOT NULL,
  author_ref     TEXT,
  division_ref   TEXT,
  proposed_at    TEXT    NOT NULL DEFAULT '',
  status         TEXT    NOT NULL DEFAULT 'proposed',
  confidence     INTEGER NOT NULL DEFAULT 0,
  clearance_req  INTEGER NOT NULL DEFAULT 0,
  abstract       TEXT    NOT NULL DEFAULT '',
  evidence_json  TEXT    NOT NULL DEFAULT '[]',
  related_json   TEXT    NOT NULL DEFAULT '[]',
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── SIGMAメッセージ（[[SIGMA-MSG-XXX]] タグ用） ───────────────────────
-- Updated: 2026-03-23
CREATE TABLE IF NOT EXISTS sigma_messages (
  id            TEXT    PRIMARY KEY,       -- SIGMA-MSG-007
  number        INTEGER NOT NULL,          -- 7
  received_at   TEXT    NOT NULL,          -- "YYYY-MM-DD HH:MM"
  medium        TEXT    NOT NULL DEFAULT 'N-VEIL 通信補助体経由',
  integrity     INTEGER NOT NULL DEFAULT 100,  -- 0–100%（<100で一部伏字）
  clearance_req INTEGER NOT NULL DEFAULT 1,
  content       TEXT    NOT NULL DEFAULT '',
  context_ref   TEXT,                          -- "DIARY-007" 等
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sigma_messages_number
  ON sigma_messages(number, clearance_req);

-- ══════════════════════════════════════════════════════════════════════
-- パフォーマンス改善インデックス（2026-03-23追加）
-- ══════════════════════════════════════════════════════════════════════

-- チャットメッセージ: 全チャンネルの最新N件取得（ポーリング・SSE移行後も有効）
CREATE INDEX IF NOT EXISTS idx_chat_messages_created
  ON chat_messages(created_at DESC);

-- 通知: 未読のみ取得（ユーザーページ・バッジ更新で頻繁にクエリされる）
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- XPログ: ランキング・集計用（ユーザー毎のXP合計の高速算出）
CREATE INDEX IF NOT EXISTS idx_xp_logs_user_total
  ON xp_logs(user_id, xp_gained);

-- ストーリーフラグ: フラグキー別の横断検索（管理者向け統計）
CREATE INDEX IF NOT EXISTS idx_progress_flags_key
  ON progress_flags(flag_key, flag_value);

-- CHECK制約（新規レコードへのガード）
-- ※ SQLiteはALTER TABLE ADD CONSTRAINTが非対応のため、
--    スキーマ再構築時またはトリガーで対応する。
--    アプリケーション側はserver-auth.tsとconstants.tsで範囲チェック済み。

-- ══════════════════════════════════════════════════════════════════════
-- ストーリートリガーDB化（2026-03-23追加）
-- ハードコードの event-triggers.ts をDBで管理できるようにする。
-- ══════════════════════════════════════════════════════════════════════

-- ── ストーリートリガー定義 ────────────────────────────────────────────
--
-- trigger_type:
--   'flag'      — progress_flagsの値を条件にする
--   'level'     — clearance_levelを条件にする
--   'xp'        — xp_totalを条件にする
--   'streak'    — consecutive_login_daysを条件にする
--   'anomaly'   — anomaly_scoreを条件にする
--   'composite' — conditions_jsonに複合条件を記述
--
-- conditions_json: JSONオブジェクト（条件パラメータ）
--   例: {"flag": "first_login_done", "not": true}
--   例: {"min_level": 2, "required_flag": "level2_unlocked", "not_flag": true}
--   例: {"min_streak": 3, "not_flag": "streak_3days_done"}
--   例: {"min_anomaly": 30, "not_flag": "anomaly_detected"}
--
-- effects_json: JSONオブジェクト（発火効果）
--   例: {"flag": "first_login_done", "xp": 50, "notification": {"type":"system","title":"...","body":"..."}}
--
CREATE TABLE IF NOT EXISTS story_triggers (
  id              TEXT    PRIMARY KEY,
  title           TEXT    NOT NULL,                    -- 管理者向け表示名
  trigger_type    TEXT    NOT NULL DEFAULT 'composite',
  active          INTEGER NOT NULL DEFAULT 1,
  priority        INTEGER NOT NULL DEFAULT 0,          -- 評価順序（高い方が先）
  once_per_user   INTEGER NOT NULL DEFAULT 1,          -- 1=ユーザー毎に一度だけ発火
  conditions_json TEXT    NOT NULL DEFAULT '{}',
  effects_json    TEXT    NOT NULL DEFAULT '{}',
  description     TEXT,                                -- 管理者向け説明
  created_by      TEXT    NOT NULL DEFAULT 'system',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_story_triggers_active_priority
  ON story_triggers(active, priority DESC);

-- ── 既存ハードコードトリガーの初期データ ─────────────────────────────
-- アプリケーション側は DB優先・コードフォールバックで動作するため
-- このINSERTを実行することでDB管理に移行できる。
-- conditions_json の "not_flag" は「そのフラグが立っていない」ことを条件にする。
INSERT OR IGNORE INTO story_triggers (id, title, trigger_type, priority, conditions_json, effects_json) VALUES
  ('first_login_complete', '初回ログイン完了', 'flag', 100,
   '{"not_flag": "first_login_done"}',
   '{"flag": "first_login_done", "notification": {"type": "system", "title": "機関へようこそ", "body": "海蝕機関への着任を確認しました。あなたのIDが正式に登録されました。"}}'),

  ('level2_unlocked', 'LV2解放通知', 'level', 90,
   '{"min_level": 2, "not_flag": "level2_unlocked"}',
   '{"flag": "level2_unlocked", "notification": {"type": "info", "title": "クリアランスレベル 2 解放", "body": "ミッション閲覧権限が付与されました。/missions にアクセス可能になりました。"}}'),

  ('level3_unlocked', 'LV3解放通知', 'level', 89,
   '{"min_level": 3, "not_flag": "level3_unlocked"}',
   '{"flag": "level3_unlocked", "notification": {"type": "info", "title": "クリアランスレベル 3 解放", "body": "コンソールアクセス権限が付与されました。深層観測データへのアクセスが可能です。"}}'),

  ('streak_3days', '3日ストリーク実績', 'streak', 70,
   '{"min_streak": 3, "not_flag": "streak_3days_done"}',
   '{"flag": "streak_3days_done", "xp": 50, "notification": {"type": "achievement", "title": "3日連続ログイン達成", "body": "継続的な活動が認められました。+50 XP を付与します。"}}'),

  ('streak_7days', '7日ストリーク実績', 'streak', 69,
   '{"min_streak": 7, "not_flag": "streak_7days_done"}',
   '{"flag": "streak_7days_done", "xp": 150, "notification": {"type": "achievement", "title": "7日連続ログイン達成", "body": "あなたの献身は機関に認められました。+150 XP を付与します。"}}'),

  ('phase1_unlocked', 'フェーズ1開始', 'composite', 60,
   '{"required_flag": "first_login_done", "min_level": 1, "not_flag": "phase1_unlocked"}',
   '{"flag": "phase1_unlocked", "notification": {"type": "story", "title": "フェーズ1 開始", "body": "海蝕現象の初期観測データへのアクセスが承認されました。収束部門からの報告を確認してください。"}}');

-- ══════════════════════════════════════════════════════════════════════
-- JSON列正規化（優先度A、2026-03-23追加）
-- db_entities.related_entities JSON → entity_relations テーブル
-- case_reports.personnel_json  JSON → case_personnel テーブル
-- operation_records.division_json JSON → operation_divisions テーブル
-- ══════════════════════════════════════════════════════════════════════

-- ── 実体間の関係（db_entities.related_entities を正規化） ────────────
CREATE TABLE IF NOT EXISTS entity_relations (
  id            TEXT PRIMARY KEY,
  from_entity   TEXT NOT NULL,  -- db_entities.code
  to_entity     TEXT NOT NULL,  -- db_entities.code
  relation_type TEXT NOT NULL DEFAULT 'related',  -- 'related' | 'predator' | 'symbiotic' | 'hostile'
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (from_entity, to_entity, relation_type)
);
CREATE INDEX IF NOT EXISTS idx_entity_relations_from ON entity_relations(from_entity);
CREATE INDEX IF NOT EXISTS idx_entity_relations_to   ON entity_relations(to_entity);

-- ── 事案記録の関係者（case_reports.personnel_json を正規化） ─────────
CREATE TABLE IF NOT EXISTS case_personnel (
  id           TEXT PRIMARY KEY,
  case_id      TEXT NOT NULL,   -- case_reports.id
  personnel_ref TEXT NOT NULL,  -- db_personnel.codename
  role         TEXT NOT NULL DEFAULT 'member',  -- 'commander' | 'member' | 'witness' | 'subject'
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (case_id, personnel_ref),
  FOREIGN KEY (case_id) REFERENCES case_reports(id)
);
CREATE INDEX IF NOT EXISTS idx_case_personnel_case ON case_personnel(case_id);
CREATE INDEX IF NOT EXISTS idx_case_personnel_person ON case_personnel(personnel_ref);

-- ── 作戦記録の参加部門（operation_records.division_json を正規化） ───
CREATE TABLE IF NOT EXISTS operation_divisions (
  id           TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL,   -- operation_records.id
  division_id  TEXT NOT NULL,   -- divisions.id
  role         TEXT NOT NULL DEFAULT 'participant',  -- 'lead' | 'participant' | 'support'
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (operation_id, division_id),
  FOREIGN KEY (operation_id) REFERENCES operation_records(id)
);
CREATE INDEX IF NOT EXISTS idx_operation_divisions_op ON operation_divisions(operation_id);
