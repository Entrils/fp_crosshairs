import fs from 'node:fs/promises'

const mapCrosshair = (row) => ({
  id: row.id,
  title: row.title,
  code: row.code,
  description: row.description || '',
  tags: row.tags || [],
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
        image_url TEXT NOT NULL,
        image_key TEXT,
        copies BIGINT NOT NULL DEFAULT 0 CHECK (copies >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS crosshairs_created_at_idx ON crosshairs (created_at DESC);
      CREATE INDEX IF NOT EXISTS crosshairs_copies_idx ON crosshairs (copies DESC);
    `)
  },

  async seedFromFile(filename) {
    const { rows: [{ count }] } = await pool.query('SELECT COUNT(*)::int AS count FROM crosshairs')
    if (count > 0) return
    const items = JSON.parse(await fs.readFile(filename, 'utf8'))
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const item of items) {
        await client.query(
          `INSERT INTO crosshairs
            (id, title, code, description, tags, image_url, image_key, copies, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NULL, 0, $7)
           ON CONFLICT (id) DO NOTHING`,
          [item.id, item.title, item.code, item.description || '', item.tags || [], item.image, item.createdAt],
        )
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
      `SELECT id, title, code, description, tags, image_url, copies, created_at
       FROM crosshairs
       ORDER BY created_at DESC`,
    )
    return rows.map(mapCrosshair)
  },

  async find(id) {
    const { rows } = await pool.query(
      `SELECT id, title, code, description, tags, image_url, image_key, copies, created_at
       FROM crosshairs WHERE id = $1`,
      [id],
    )
    return rows[0] ? { ...mapCrosshair(rows[0]), imageKey: rows[0].image_key } : null
  },

  async create(item) {
    const { rows } = await pool.query(
      `INSERT INTO crosshairs
        (id, title, code, description, tags, image_url, image_key, copies, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
       RETURNING id, title, code, description, tags, image_url, copies, created_at`,
      [item.id, item.title, item.code, item.description, item.tags, item.image, item.imageKey, item.createdAt],
    )
    return mapCrosshair(rows[0])
  },

  async incrementCopies(id) {
    const { rows } = await pool.query(
      `UPDATE crosshairs SET copies = copies + 1
       WHERE id = $1
       RETURNING id, title, code, description, tags, image_url, copies, created_at`,
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
