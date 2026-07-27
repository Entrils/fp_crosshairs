CREATE TABLE IF NOT EXISTS crosshairs (
  id TEXT PRIMARY KEY,
  title VARCHAR(80) NOT NULL,
  code TEXT NOT NULL,
  description VARCHAR(300) NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  color VARCHAR(16),
  crosshair_type VARCHAR(16),
  image_url TEXT NOT NULL,
  image_key TEXT,
  copies BIGINT NOT NULL DEFAULT 0 CHECK (copies >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE crosshairs ADD COLUMN IF NOT EXISTS color VARCHAR(16);
ALTER TABLE crosshairs ADD COLUMN IF NOT EXISTS crosshair_type VARCHAR(16);

CREATE INDEX IF NOT EXISTS crosshairs_created_at_idx ON crosshairs (created_at DESC);
CREATE INDEX IF NOT EXISTS crosshairs_copies_idx ON crosshairs (copies DESC);
