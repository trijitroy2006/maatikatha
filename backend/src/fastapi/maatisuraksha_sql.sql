-- ================================================================
-- MaatiKatha Phase II: MaatiSuraksha Schema
-- Run in Supabase SQL Editor
-- ================================================================

-- Add resilience scoring columns to farms table
ALTER TABLE farms
  ADD COLUMN IF NOT EXISTS resilience_score   INTEGER     DEFAULT 50
    CHECK (resilience_score >= 0 AND resilience_score <= 100),
  ADD COLUMN IF NOT EXISTS insurance_band     TEXT,
  ADD COLUMN IF NOT EXISTS last_scored_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_rate_pct   NUMERIC(4,2);

-- Farmer adaptation actions (each action earns points)
CREATE TABLE IF NOT EXISTS farmer_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id       UUID        NOT NULL,
  farmer_id     UUID        NOT NULL,
  action_type   TEXT        NOT NULL CHECK (action_type IN (
    'soil_test', 'disease_scan', 'climate_check', 'insurance_purchase',
    'crop_diversification', 'composting', 'water_harvest', 'training_attended',
    'field_photo_upload', 'doctor_consult', 'acoustic_scan'
  )),
  action_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  points_awarded INTEGER    NOT NULL DEFAULT 5,
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmer_actions_farm ON farmer_actions(farm_id);
CREATE INDEX IF NOT EXISTS idx_farmer_actions_farmer ON farmer_actions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_actions_date ON farmer_actions(action_date DESC);
CREATE INDEX IF NOT EXISTS idx_farmer_actions_type ON farmer_actions(action_type);

-- Historical resilience score tracking
CREATE TABLE IF NOT EXISTS resilience_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     UUID        NOT NULL,
  farmer_id   UUID        NOT NULL,
  score       INTEGER     NOT NULL CHECK (score >= 0 AND score <= 100),
  band        TEXT        NOT NULL,
  premium_pct NUMERIC(4,2),
  snapshot    JSONB,   -- stores score_breakdown JSON
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resilience_history_farm ON resilience_history(farm_id, recorded_at DESC);

-- Row Level Security (enable in Supabase)
ALTER TABLE farmer_actions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE resilience_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY farmer_actions_own   ON farmer_actions   FOR ALL USING (farmer_id = auth.uid());
CREATE POLICY resilience_hist_own  ON resilience_history FOR ALL USING (farmer_id = auth.uid());

-- ================================================================
