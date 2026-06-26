-- ============================================================================
-- Migration 005: RigLog – Equipment-Tracking (Satellit 1)
-- ----------------------------------------------------------------------------
-- In Neon ausführen. Idempotent.
-- Material gehört einem Segler ODER einem Verein (Charterflotte später).
--   owner_type ∈ ('segler','verein'); owner_id = Account-ID.
--   part_type: 'boat','sail','mast','foil','sheet','foilboard','other'
-- equipment_log: Stunden-Einträge + Wartung/Reparatur-Historie.
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment (
  id            TEXT PRIMARY KEY,
  owner_type    TEXT NOT NULL,
  owner_id      TEXT NOT NULL,
  klasse        TEXT,
  part_type     TEXT NOT NULL DEFAULT 'other',
  name          TEXT NOT NULL,
  identifier    TEXT,                      -- Segel-/Rumpfnummer etc.
  hours         NUMERIC(8,1) NOT NULL DEFAULT 0,
  purchased_at  DATE,
  service_interval_hours NUMERIC(8,1),     -- Wartung fällig alle X Stunden (optional)
  status        TEXT NOT NULL DEFAULT 'active',  -- active | retired
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_owner ON equipment (owner_type, owner_id);

CREATE TABLE IF NOT EXISTS equipment_log (
  id            TEXT PRIMARY KEY,
  equipment_id  TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'maintenance',  -- hours | maintenance | repair
  hours_added   NUMERIC(8,1),
  description   TEXT,
  logged_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_log_equipment ON equipment_log (equipment_id);

-- ============================================================================
-- Fertig.
-- ============================================================================
