-- ============================================================================
-- Migration 003: Yardstick-Konfiguration pro Regatta (Event)
-- ----------------------------------------------------------------------------
-- In Neon ausführen. Idempotent.
-- Legt pro Event + Bootsklasse fest, ob nach Zeit (Yardstick) gewertet wird
-- und zu welcher gemeinsamen Flotte die Klasse gehört.
--   time_based  = TRUE  -> Zeiten eingeben, korrigierte Zeit bestimmt den Platz
--   fleet_group = nicht-leer -> Klassen mit gleicher Gruppe werden gemeinsam
--                 gewertet (gemischte Yardstick-Flotte). Leer = nur diese Klasse.
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_yardstick (
  event_id    TEXT NOT NULL,
  klasse      TEXT NOT NULL,
  time_based  BOOLEAN NOT NULL DEFAULT FALSE,
  fleet_group TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, klasse)
);

CREATE INDEX IF NOT EXISTS idx_event_yardstick_event
  ON event_yardstick (event_id);

-- ============================================================================
-- Fertig.
-- ============================================================================
