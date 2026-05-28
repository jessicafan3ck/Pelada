-- ============================================================
-- Pelada – StatsBomb WWC 2023 + Men's WC 2022 Schema
-- Run this ONCE in your Supabase SQL Editor before ingesting.
-- Safe to re-run: drops + recreates everything.
-- ============================================================

DROP TABLE IF EXISTS wwc2023_threesixty   CASCADE;
DROP TABLE IF EXISTS wwc2023_player_stats CASCADE;
DROP TABLE IF EXISTS wwc2023_events       CASCADE;
DROP TABLE IF EXISTS wwc2023_lineups      CASCADE;
DROP TABLE IF EXISTS wwc2023_matches      CASCADE;
DROP TABLE IF EXISTS wc2022m_player_stats CASCADE;
DROP TABLE IF EXISTS wc2022m_lineups      CASCADE;
DROP TABLE IF EXISTS wc2022m_matches      CASCADE;

-- ── Women's World Cup 2023 ────────────────────────────────────────────────────

CREATE TABLE wwc2023_matches (
  match_id          BIGINT PRIMARY KEY,
  match_date        DATE    NOT NULL,
  kick_off          TEXT,
  home_team         TEXT    NOT NULL,
  away_team         TEXT    NOT NULL,
  home_score        INTEGER NOT NULL DEFAULT 0,
  away_score        INTEGER NOT NULL DEFAULT 0,
  competition_stage TEXT,
  match_week        INTEGER,
  stadium           TEXT,
  stadium_country   TEXT,
  home_group        TEXT,
  away_group        TEXT,
  home_manager      TEXT,
  away_manager      TEXT,
  has_360           BOOLEAN DEFAULT TRUE
);

CREATE TABLE wwc2023_lineups (
  id              SERIAL PRIMARY KEY,
  match_id        BIGINT  NOT NULL REFERENCES wwc2023_matches(match_id) ON DELETE CASCADE,
  team            TEXT    NOT NULL,
  player_id       BIGINT,
  player_name     TEXT    NOT NULL,
  player_nickname TEXT,
  jersey_number   INTEGER,
  position        TEXT,
  position_id     INTEGER,
  country         TEXT,
  is_starter      BOOLEAN DEFAULT TRUE
);
CREATE INDEX ON wwc2023_lineups(match_id);
CREATE INDEX ON wwc2023_lineups(player_name);
CREATE INDEX ON wwc2023_lineups(team);

CREATE TABLE wwc2023_events (
  event_id          TEXT PRIMARY KEY,
  match_id          BIGINT NOT NULL REFERENCES wwc2023_matches(match_id) ON DELETE CASCADE,
  idx               INTEGER,
  period            INTEGER,
  minute            INTEGER,
  second            INTEGER,
  type              TEXT,
  team              TEXT,
  player            TEXT,
  player_id         BIGINT,
  position          TEXT,
  x                 FLOAT,
  y                 FLOAT,
  under_pressure    BOOLEAN,
  possession_team   TEXT,
  play_pattern      TEXT,
  -- Shot
  shot_xg           FLOAT,
  shot_outcome      TEXT,
  shot_technique    TEXT,
  shot_body_part    TEXT,
  shot_end_x        FLOAT,
  shot_end_y        FLOAT,
  shot_end_z        FLOAT,
  -- Pass
  pass_length       FLOAT,
  pass_angle        FLOAT,
  pass_outcome      TEXT,
  pass_recipient    TEXT,
  pass_end_x        FLOAT,
  pass_end_y        FLOAT,
  pass_height       TEXT,
  pass_switch       BOOLEAN,
  pass_cross        BOOLEAN,
  pass_through_ball BOOLEAN,
  pass_shot_assist  BOOLEAN,
  pass_key_pass     BOOLEAN,
  -- Carry
  carry_end_x       FLOAT,
  carry_end_y       FLOAT,
  -- Dribble
  dribble_outcome   TEXT,
  -- Misc
  counterpress      BOOLEAN,
  duration          FLOAT
);
CREATE INDEX ON wwc2023_events(match_id);
CREATE INDEX ON wwc2023_events(type);
CREATE INDEX ON wwc2023_events(player);
CREATE INDEX ON wwc2023_events(team);

CREATE TABLE wwc2023_threesixty (
  id           SERIAL PRIMARY KEY,
  event_id     TEXT   NOT NULL REFERENCES wwc2023_events(event_id) ON DELETE CASCADE,
  match_id     BIGINT NOT NULL REFERENCES wwc2023_matches(match_id) ON DELETE CASCADE,
  visible_area JSONB,
  freeze_frame JSONB
);
CREATE INDEX ON wwc2023_threesixty(match_id);
CREATE INDEX ON wwc2023_threesixty(event_id);

CREATE TABLE wwc2023_player_stats (
  id                 SERIAL PRIMARY KEY,
  match_id           BIGINT NOT NULL REFERENCES wwc2023_matches(match_id) ON DELETE CASCADE,
  player_id          BIGINT,
  player_name        TEXT   NOT NULL,
  team               TEXT,
  minutes_played     FLOAT  DEFAULT 0,
  passes             INTEGER DEFAULT 0,
  passes_complete    INTEGER DEFAULT 0,
  shots              INTEGER DEFAULT 0,
  shots_on_target    INTEGER DEFAULT 0,
  goals              INTEGER DEFAULT 0,
  xg                 FLOAT  DEFAULT 0,
  assists            INTEGER DEFAULT 0,
  key_passes         INTEGER DEFAULT 0,
  pressures          INTEGER DEFAULT 0,
  carries            INTEGER DEFAULT 0,
  dribbles           INTEGER DEFAULT 0,
  dribbles_complete  INTEGER DEFAULT 0,
  blocks             INTEGER DEFAULT 0,
  interceptions      INTEGER DEFAULT 0,
  clearances         INTEGER DEFAULT 0,
  fouls_committed    INTEGER DEFAULT 0,
  fouls_won          INTEGER DEFAULT 0,
  yellow_cards       INTEGER DEFAULT 0,
  red_cards          INTEGER DEFAULT 0
);
CREATE INDEX ON wwc2023_player_stats(match_id);
CREATE INDEX ON wwc2023_player_stats(player_name);
CREATE INDEX ON wwc2023_player_stats(team);

-- ── Men's World Cup 2022 (GOAT Builder) ──────────────────────────────────────

CREATE TABLE wc2022m_matches (
  match_id          BIGINT PRIMARY KEY,
  match_date        DATE,
  home_team         TEXT,
  away_team         TEXT,
  home_score        INTEGER DEFAULT 0,
  away_score        INTEGER DEFAULT 0,
  competition_stage TEXT,
  match_week        INTEGER,
  stadium           TEXT
);

CREATE TABLE wc2022m_lineups (
  id              SERIAL PRIMARY KEY,
  match_id        BIGINT NOT NULL REFERENCES wc2022m_matches(match_id) ON DELETE CASCADE,
  team            TEXT,
  player_id       BIGINT,
  player_name     TEXT,
  player_nickname TEXT,
  jersey_number   INTEGER,
  position        TEXT,
  country         TEXT,
  is_starter      BOOLEAN DEFAULT TRUE
);
CREATE INDEX ON wc2022m_lineups(player_name);
CREATE INDEX ON wc2022m_lineups(team);

CREATE TABLE wc2022m_player_stats (
  id                 SERIAL PRIMARY KEY,
  player_id          BIGINT,
  player_name        TEXT NOT NULL,
  player_nickname    TEXT,
  team               TEXT,
  position           TEXT,
  matches_played     INTEGER DEFAULT 0,
  minutes_played     FLOAT   DEFAULT 0,
  goals              INTEGER DEFAULT 0,
  xg                 FLOAT   DEFAULT 0,
  assists            INTEGER DEFAULT 0,
  key_passes         INTEGER DEFAULT 0,
  passes             INTEGER DEFAULT 0,
  passes_complete    INTEGER DEFAULT 0,
  shots              INTEGER DEFAULT 0,
  shots_on_target    INTEGER DEFAULT 0,
  pressures          INTEGER DEFAULT 0,
  dribbles_complete  INTEGER DEFAULT 0
);
CREATE INDEX ON wc2022m_player_stats(player_name);
CREATE INDEX ON wc2022m_player_stats(team);

-- ── Row Level Security (public read — all open data) ─────────────────────────

ALTER TABLE wwc2023_matches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wwc2023_lineups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wwc2023_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE wwc2023_threesixty   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wwc2023_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc2022m_matches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc2022m_lineups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc2022m_player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON wwc2023_matches      FOR SELECT USING (true);
CREATE POLICY "public read" ON wwc2023_lineups      FOR SELECT USING (true);
CREATE POLICY "public read" ON wwc2023_events       FOR SELECT USING (true);
CREATE POLICY "public read" ON wwc2023_threesixty   FOR SELECT USING (true);
CREATE POLICY "public read" ON wwc2023_player_stats FOR SELECT USING (true);
CREATE POLICY "public read" ON wc2022m_matches      FOR SELECT USING (true);
CREATE POLICY "public read" ON wc2022m_lineups      FOR SELECT USING (true);
CREATE POLICY "public read" ON wc2022m_player_stats FOR SELECT USING (true);
