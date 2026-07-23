import fs from 'node:fs/promises'

const mapCrosshair = (row) => ({
  id: row.id,
  title: row.title,
  code: row.code,
  description: row.description || '',
  tags: row.tags || [],
  color: row.color || '',
  type: row.crosshair_type || '',
  image: row.image_url,
  copies: Number(row.copies || 0),
  createdAt: new Date(row.created_at).toISOString(),
})

export const createRepository = (pool) => ({
  async migrate() {
    await pool.query(`
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
      CREATE INDEX IF NOT EXISTS crosshairs_created_at_idx ON crosshairs (created_at DESC);
      CREATE INDEX IF NOT EXISTS crosshairs_copies_idx ON crosshairs (copies DESC);
      ALTER TABLE crosshairs ADD COLUMN IF NOT EXISTS color VARCHAR(16);
      ALTER TABLE crosshairs ADD COLUMN IF NOT EXISTS crosshair_type VARCHAR(16);
    `)
  },

  async seedFromFile(filename) {
    const items = JSON.parse(await fs.readFile(filename, 'utf8'))
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows: [{ count }] } = await client.query('SELECT COUNT(*)::int AS count FROM crosshairs')
      if (count === 0) {
        for (const item of items) {
          await client.query(
            `INSERT INTO crosshairs
              (id, title, code, description, tags, color, crosshair_type, image_url, image_key, copies, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, 0, $9)
             ON CONFLICT (id) DO NOTHING`,
            [
              item.id,
              item.title,
              item.code,
              item.description || '',
              item.tags || [],
              item.color || null,
              item.type || null,
              item.image,
              item.createdAt,
            ],
          )
        }
      } else {
        for (const item of items) {
          await client.query(
            `UPDATE crosshairs
             SET color = COALESCE(color, $2), crosshair_type = COALESCE(crosshair_type, $3)
             WHERE id = $1`,
            [item.id, item.color || null, item.type || null],
          )
        }
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  async list() {
    const { rows } = await pool.query(
      `SELECT id, title, code, description, tags, color, crosshair_type, image_url, copies, created_at
       FROM crosshairs
       ORDER BY created_at DESC`,
    )
    return rows.map(mapCrosshair)
  },

  async find(id) {
    const { rows } = await pool.query(
      `SELECT id, title, code, description, tags, color, crosshair_type, image_url, image_key, copies, created_at
       FROM crosshairs WHERE id = $1`,
      [id],
    )
    return rows[0] ? { ...mapCrosshair(rows[0]), imageKey: rows[0].image_key } : null
  },

  async create(item) {
    const { rows } = await pool.query(
      `INSERT INTO crosshairs
        (id, title, code, description, tags, color, crosshair_type, image_url, image_key, copies, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10)
       RETURNING id, title, code, description, tags, color, crosshair_type, image_url, copies, created_at`,
      [
        item.id,
        item.title,
        item.code,
        item.description,
        item.tags,
        item.color,
        item.type,
        item.image,
        item.imageKey,
        item.createdAt,
      ],
    )
    return mapCrosshair(rows[0])
  },

  async update(id, item) {
    const { rows } = await pool.query(
      `UPDATE crosshairs
       SET title = $2,
           code = $3,
           description = $4,
           tags = $5,
           color = $6,
           crosshair_type = $7,
           image_url = $8,
           image_key = $9
       WHERE id = $1
       RETURNING id, title, code, description, tags, color, crosshair_type, image_url, copies, created_at`,
      [
        id,
        item.title,
        item.code,
        item.description,
        item.tags,
        item.color,
        item.type,
        item.image,
        item.imageKey,
      ],
    )
    return rows[0] ? mapCrosshair(rows[0]) : null
  },

  async incrementCopies(id) {
    const { rows } = await pool.query(
      `UPDATE crosshairs SET copies = copies + 1
       WHERE id = $1
       RETURNING id, title, code, description, tags, color, crosshair_type, image_url, copies, created_at`,
      [id],
    )
    return rows[0] ? mapCrosshair(rows[0]) : null
  },

  async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM crosshairs WHERE id = $1 RETURNING image_key',
      [id],
    )
    return rows[0] || null
  },

  async health() {
    await pool.query('SELECT 1')
  },

  async close() {
    await pool.end()
  },
})
