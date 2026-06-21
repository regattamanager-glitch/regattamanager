-- ============================================================================
-- Migration 002: Yardstick je Verein / Föderation (selbst verwaltbar)
-- ----------------------------------------------------------------------------
-- In Neon (SQL-Editor) ausführen. Idempotent.
-- Vereine UND Föderationen pflegen ihre eigene Yardstick-Konfiguration:
--   * eine Berechnungsart (method)
--   * pro Bootsklasse eine Yardstickzahl (coefficient)
-- owner_type ∈ ('verein', 'federation'); owner_id = die jeweilige Account-ID.
-- ============================================================================

-- Berechnungsart pro Owner
CREATE TABLE IF NOT EXISTS yardstick_config (
  owner_type TEXT NOT NULL,
  owner_id   TEXT NOT NULL,
  method     TEXT NOT NULL DEFAULT 'time_on_time'
               CHECK (method IN ('time_on_time', 'time_on_distance')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_type, owner_id)
);

-- Yardstickzahl pro Owner + Bootsklasse
CREATE TABLE IF NOT EXISTS yardstick_values (
  owner_type  TEXT NOT NULL,
  owner_id    TEXT NOT NULL,
  klasse      TEXT NOT NULL,
  coefficient NUMERIC(7,2) NOT NULL DEFAULT 100,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_type, owner_id, klasse)
);

CREATE INDEX IF NOT EXISTS idx_yardstick_values_owner
  ON yardstick_values (owner_type, owner_id);

-- ============================================================================
-- Fertig. Danach können Vereine & Föderationen ihren Yardstick selbst pflegen.
-- ============================================================================
