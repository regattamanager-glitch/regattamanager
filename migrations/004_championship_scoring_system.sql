-- ============================================================================
-- Migration 004: Wertungssystem & skalierende Streicher pro Meisterschaft
-- ----------------------------------------------------------------------------
-- In Neon ausführen. Idempotent.
--   scoring_system    = wie ein Platz in Punkte umgerechnet wird:
--                       'low_point'  (Platz = Punkte, wenig = besser)  [Standard]
--                       'high_point' (1. bekommt die meisten Punkte, viel = besser)
--                       'bonus_point'(klassische Bonus-Punkt-Tabelle, wenig = besser)
--   races_per_discard = ab wie vielen Wettfahrten je ein Streicher greift.
--                       0 = keine Streicher. Beispiel 4: 4 Rennen -> 1 Streicher,
--                       8 Rennen -> 2 Streicher (skaliert je Klasse mit ihrer
--                       tatsächlichen Rennanzahl).
-- ============================================================================

ALTER TABLE championships
  ADD COLUMN IF NOT EXISTS scoring_system TEXT NOT NULL DEFAULT 'low_point';

ALTER TABLE championships
  ADD COLUMN IF NOT EXISTS races_per_discard INTEGER NOT NULL DEFAULT 4;

-- Absicherung der erlaubten Werte
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'championships_scoring_system_chk'
  ) THEN
    ALTER TABLE championships
      ADD CONSTRAINT championships_scoring_system_chk
      CHECK (scoring_system IN ('low_point', 'high_point', 'bonus_point'));
  END IF;
END $$;

-- ============================================================================
-- Fertig.
-- ============================================================================
