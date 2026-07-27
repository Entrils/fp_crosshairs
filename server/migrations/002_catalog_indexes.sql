ALTER TABLE crosshairs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS crosshairs_color_idx ON crosshairs (color);
CREATE INDEX IF NOT EXISTS crosshairs_type_idx ON crosshairs (crosshair_type);
CREATE INDEX IF NOT EXISTS crosshairs_tags_idx ON crosshairs USING GIN (tags);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crosshairs_color_check'
  ) THEN
    ALTER TABLE crosshairs
      ADD CONSTRAINT crosshairs_color_check
      CHECK (color IS NULL OR color IN ('red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'white', 'black'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crosshairs_type_check'
  ) THEN
    ALTER TABLE crosshairs
      ADD CONSTRAINT crosshairs_type_check
      CHECK (crosshair_type IS NULL OR crosshair_type IN ('circle', 'dot', 'square', 'cross'))
      NOT VALID;
  END IF;
END
$$;
