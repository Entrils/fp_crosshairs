import fs from 'node:fs/promises'
import { imageVariantsFromUrl } from './image-variants.js'

const mapCrosshair = (row) => {
  const images = imageVariantsFromUrl(row.image_url)
  return {
    id: row.id,
    title: row.title,
    code: row.code,
    description: row.description || '',
    tags: row.tags || [],
    color: row.color || '',
    type: row.crosshair_type || '',
    image: images.full,
    images,
    copies: Number(row.copies || 0),
    status: row.status || 'published',
    featured: Boolean(row.is_featured),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at || row.created_at).toISOString(),
  }
}

const buildGalleryWhere = ({ query = '', tag = '', color = '', type = '' } = {}) => {
  const clauses = ["status = 'published'"]
  const values = []
  const parameter = (value) => {
    values.push(value)
    return `$${values.length}`
  }

  if (query) {
    const token = parameter(`%${query}%`)
    clauses.push(`(
      title ILIKE ${token}
      OR EXISTS (SELECT 1 FROM unnest(tags) AS tag_name WHERE tag_name ILIKE ${token})
    )`)
  }
  if (tag) clauses.push(`${parameter(tag)} = ANY(tags)`)
  if (color) clauses.push(`color = ${parameter(color)}`)
  if (type === 'none') clauses.push('crosshair_type IS NULL')
  else if (type) clauses.push(`crosshair_type = ${parameter(type)}`)

  return {
    sql: `WHERE ${clauses.join(' AND ')}`,
    values,
  }
}

export const createRepository = (pool) => ({
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

  async list({ page = 1, limit = 12, query = '', tag = '', color = '', type = '', sort = 'popular' } = {}) {
    const filters = buildGalleryWhere({ query, tag, color, type })
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM crosshairs ${filters.sql}`,
      filters.values,
    )
    const total = countResult.rows[0].count
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(page, totalPages)
    const orderBy = sort === 'new'
      ? 'created_at DESC'
      : 'is_featured DESC, copies DESC, created_at DESC'
    const values = [...filters.values, limit, (safePage - 1) * limit]
    const { rows } = await pool.query(
      `SELECT id, title, code, description, tags, color, crosshair_type, image_url, copies, status, is_featured, created_at, updated_at
       FROM crosshairs
       ${filters.sql}
       ORDER BY ${orderBy}
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    )
    return {
      items: rows.map(mapCrosshair),
      total,
      page: safePage,
      limit,
      totalPages,
    }
  },

  async listAll() {
    const { rows } = await pool.query(
      `SELECT id, title, code, description, tags, color, crosshair_type, image_url, copies, status, is_featured, created_at, updated_at
       FROM crosshairs
       ORDER BY updated_at DESC`,
    )
    return rows.map(mapCrosshair)
  },

  async listTags() {
    const { rows } = await pool.query(
      `SELECT tag_value AS tag, COUNT(*)::int AS count
       FROM crosshairs
       CROSS JOIN LATERAL unnest(tags) AS tag_list(tag_value)
       WHERE status = 'published'
       GROUP BY tag_value
       ORDER BY count DESC, tag_value ASC
       LIMIT 20`,
    )
    return rows
  },

  async stats() {
    const { rows: [row] } = await pool.query(
      `SELECT COUNT(*)::int AS total, COALESCE(SUM(copies), 0)::bigint AS copies
       FROM crosshairs WHERE status = 'published'`,
    )
    return { total: row.total, copies: Number(row.copies) }
  },

  async listIds() {
    const { rows } = await pool.query(
      `SELECT id, created_at, updated_at FROM crosshairs
       WHERE status = 'published' ORDER BY created_at DESC`,
    )
    return rows.map((row) => ({
      id: row.id,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at || row.created_at).toISOString(),
    }))
  },

  async find(id, { includeDrafts = false } = {}) {
    const { rows } = await pool.query(
      `SELECT id, title, code, description, tags, color, crosshair_type, image_url, image_key,
              copies, status, is_featured, created_at, updated_at
       FROM crosshairs
       WHERE id = $1 AND ($2::boolean OR status = 'published')`,
      [id, includeDrafts],
    )
    return rows[0] ? { ...mapCrosshair(rows[0]), imageKey: rows[0].image_key } : null
  },

  async findMany(ids) {
    if (!ids.length) return []
    const { rows } = await pool.query(
      `SELECT id, title, code, description, tags, color, crosshair_type, image_url, copies, status, is_featured, created_at, updated_at
       FROM crosshairs
       WHERE id = ANY($1::text[]) AND status = 'published'
       ORDER BY array_position($1::text[], id)`,
      [ids],
    )
    return rows.map(mapCrosshair)
  },

  async related(id, limit = 4) {
    const { rows } = await pool.query(
      `WITH target AS (
         SELECT color, crosshair_type, tags
         FROM crosshairs
         WHERE id = $1 AND status = 'published'
       )
       SELECT item.id, item.title, item.code, item.description, item.tags, item.color,
              item.crosshair_type, item.image_url, item.copies, item.status, item.is_featured,
              item.created_at, item.updated_at
       FROM crosshairs AS item
       CROSS JOIN target
       WHERE item.id <> $1 AND item.status = 'published'
       ORDER BY (
         CASE WHEN item.crosshair_type IS NOT DISTINCT FROM target.crosshair_type THEN 4 ELSE 0 END
         + CASE WHEN item.color IS NOT DISTINCT FROM target.color THEN 3 ELSE 0 END
         + cardinality(ARRAY(SELECT unnest(item.tags) INTERSECT SELECT unnest(target.tags)))
       ) DESC,
       item.copies DESC,
       item.created_at DESC
       LIMIT $2`,
      [id, limit],
    )
    return rows.map(mapCrosshair)
  },

  async create(item) {
    const { rows } = await pool.query(
      `INSERT INTO crosshairs
        (id, title, code, description, tags, color, crosshair_type, image_url, image_key,
         copies, status, is_featured, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12)
       RETURNING id, title, code, description, tags, color, crosshair_type, image_url,
                 copies, status, is_featured, created_at, updated_at`,
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
        item.status,
        item.featured,
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
           image_key = $9,
           status = $10,
           is_featured = $11,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, code, description, tags, color, crosshair_type, image_url,
                 copies, status, is_featured, created_at, updated_at`,
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
        item.status,
        item.featured,
      ],
    )
    return rows[0] ? mapCrosshair(rows[0]) : null
  },

  async incrementCopies(id) {
    const { rows } = await pool.query(
      `WITH updated AS (
         UPDATE crosshairs SET copies = copies + 1
         WHERE id = $1 AND status = 'published'
         RETURNING id, title, code, description, tags, color, crosshair_type, image_url,
                   copies, status, is_featured, created_at, updated_at
       ),
       recorded AS (
         INSERT INTO copy_events_daily (crosshair_id, day, copies)
         SELECT id, CURRENT_DATE, 1 FROM updated
         ON CONFLICT (crosshair_id, day)
         DO UPDATE SET copies = copy_events_daily.copies + 1
       )
       SELECT * FROM updated`,
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

  async adminStats() {
    const [{ rows: [summary] }, { rows: daily }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'published')::int AS published,
                COUNT(*) FILTER (WHERE status = 'draft')::int AS drafts,
                COALESCE(SUM(copies), 0)::bigint AS copies
         FROM crosshairs`,
      ),
      pool.query(
        `SELECT day::text, SUM(copies)::bigint AS copies
         FROM copy_events_daily
         WHERE day >= CURRENT_DATE - INTERVAL '13 days'
         GROUP BY day
         ORDER BY day ASC`,
      ),
    ])
    return {
      total: summary.total,
      published: summary.published,
      drafts: summary.drafts,
      copies: Number(summary.copies),
      daily: daily.map((row) => ({ day: row.day, copies: Number(row.copies) })),
    }
  },

  async health() {
    await pool.query('SELECT 1')
  },

  async close() {
    await pool.end()
  },
})
