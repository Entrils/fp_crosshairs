import fs from 'node:fs/promises'
import path from 'node:path'

const migrationPattern = /^\d+_[a-z0-9_-]+\.sql$/i

export const runMigrations = async (pool, migrationsDir) => {
  const filenames = (await fs.readdir(migrationsDir))
    .filter((filename) => migrationPattern.test(filename))
    .sort()
  const client = await pool.connect()
  const applied = []
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    const { rows } = await client.query('SELECT filename FROM schema_migrations')
    const completed = new Set(rows.map(({ filename }) => filename))
    for (const filename of filenames) {
      if (completed.has(filename)) continue
      const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [filename],
        )
        await client.query('COMMIT')
        applied.push(filename)
      } catch (error) {
        await client.query('ROLLBACK')
        throw Object.assign(error, { migration: filename })
      }
    }
  } finally {
    client.release()
  }
  return applied
}
