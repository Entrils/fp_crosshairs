ALTER TABLE crosshairs
  ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crosshairs_status_check'
  ) THEN
    ALTER TABLE crosshairs
      ADD CONSTRAINT crosshairs_status_check
      CHECK (status IN ('draft', 'published'))
      NOT VALID;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS crosshairs_public_catalog_idx
  ON crosshairs (status, is_featured DESC, copies DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS copy_events_daily (
  crosshair_id TEXT NOT NULL REFERENCES crosshairs(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  copies BIGINT NOT NULL DEFAULT 0 CHECK (copies >= 0),
  PRIMARY KEY (crosshair_id, day)
);

CREATE INDEX IF NOT EXISTS copy_events_daily_day_idx
  ON copy_events_daily (day DESC);
