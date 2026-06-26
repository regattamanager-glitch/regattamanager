-- ============================================================================
-- Migration 001: Föderationen, Meisterschaften & Bootsklassen-Koeffizienten
-- ----------------------------------------------------------------------------
-- In Neon (SQL-Editor) einmalig ausführen. Idempotent: kann gefahrlos
-- mehrfach laufen (IF NOT EXISTS / ON CONFLICT).
-- IDs werden vom Backend als String-UUIDs erzeugt -> Spalten sind TEXT,
-- bewusst ohne harte Foreign Keys (konsistent mit dem bestehenden Schema).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Föderationen (neuer Account-Typ, analog zu "Verein")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Federation" (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  passwort      TEXT NOT NULL,
  name          TEXT NOT NULL,
  kuerzel       TEXT,
  region        TEXT,                       -- z.B. Bundesland / Region
  "isApproved"  BOOLEAN NOT NULL DEFAULT FALSE,
  instagram     TEXT,
  tiktok        TEXT,
  profilbild    TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2) Meisterschaften (eine Föderation, mehrere Regatten)
-- ----------------------------------------------------------------------------
-- scoring_mode:
--   'sum'     = Summe aller verknüpften Regatten (Low-Point)
--   'discard' = Summe, aber die schlechtesten <discard_count> Regatten gestrichen
--   'best'    = nur das beste Einzelergebnis zählt
-- level: Freitext, z.B. 'Landesmeisterschaft', 'Regionalmeisterschaft'
CREATE TABLE IF NOT EXISTS championships (
  id            TEXT PRIMARY KEY,
  federation_id TEXT NOT NULL,
  name          TEXT NOT NULL,
  level         TEXT,
  scoring_mode  TEXT NOT NULL DEFAULT 'sum'
                  CHECK (scoring_mode IN ('sum', 'discard', 'best')),
  discard_count INTEGER NOT NULL DEFAULT 0,
  bootsklassen  JSONB NOT NULL DEFAULT '[]'::jsonb,  -- gewertete Klassen ([] = alle)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_championships_federation
  ON championships (federation_id);

-- ----------------------------------------------------------------------------
-- 3) Verknüpfung Meisterschaft <-> Regatta (n:m)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS championship_events (
  championship_id TEXT NOT NULL,
  event_id        TEXT NOT NULL,
  position        INTEGER NOT NULL DEFAULT 0,  -- Reihenfolge / Lauf-Nr.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (championship_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_championship_events_event
  ON championship_events (event_id);

-- ----------------------------------------------------------------------------
-- 4) Globale Bootsklassen mit Koeffizient (Yardstick) + Zeit-Wertungsflag
-- ----------------------------------------------------------------------------
-- coefficient: Yardstickzahl (YZ). Berechnete Zeit = gesegelte Zeit * 100 / YZ.
-- time_based:  TRUE  -> Ergebnis wird über Zeiten + Yardstick ermittelt
--              FALSE -> klassische Platz-/Punkte-Eingabe (unverändert)
CREATE TABLE IF NOT EXISTS boat_classes (
  name        TEXT PRIMARY KEY,
  coefficient NUMERIC(7,2) NOT NULL DEFAULT 100,
  time_based  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: bestehende Bootsklassen-Liste. Standard-Koeffizient 100 / nicht
-- zeitbasiert -> bestehendes Verhalten bleibt unverändert, bis du im
-- Admin echte Yardstickzahlen setzt.
INSERT INTO boat_classes (name) VALUES
  ('ILCA'),('ILCA 4'),('ILCA 6'),('ILCA 7'),('Optimist'),('420'),('470'),
  ('49er'),('49erFX'),('29er'),('Finn'),('Europe'),('RS:X'),('iQFoil'),
  ('Nacra 17'),('Nacra 15'),('Vaurien'),('FJ'),('Fireball'),('505'),
  ('Hobie Cat 16'),('RS Aero'),('OK Dinghy'),('Topper'),('Dragon'),('Star'),
  ('Soling'),('Flying Dutchman'),('Tornado'),('J70'),('J80'),('Snipe'),
  ('RS200'),('RS400'),('RS500'),('RS700'),('RS800'),('RS100'),('Moth'),
  ('Formula 18'),('A-Cat'),('Elliott 6m'),('O-Jolle'),('Firefly'),('Sharpie'),
  ('Swallow'),('Tempest'),('Laser II'),('International 14'),('RS Feva'),
  ('RS Vision'),('Yngling'),('5,5m-R-Klasse'),('6m-R-Klasse'),('J24'),
  ('8m-R-Klasse'),('Contender'),('Splash'),('Zoom8'),('Sunfish'),('B14'),
  ('Musto Skiff'),('RS Tera'),('O''pen BIC'),('Sonstige')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Fertig. Danach kann das Backend Föderationen, Meisterschaften und
-- Koeffizienten nutzen.
-- ============================================================================
