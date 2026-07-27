import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runMigrations } from '../src/migrations.js'
import { createRepository } from '../src/repository.js'

const connectionString = process.env.TEST_DATABASE_URL
const describeWithPostgres = connectionString ? describe : describe.skip
const migrationsDir = path.join(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  'migrations',
)

describeWithPostgres('PostgreSQL repository integration', () => {
  const databaseName = `fragpunk_test_${process.pid}_${Date.now()}`
  let adminPool
  let pool
  let repository

  beforeAll(async () => {
    const adminUrl = new URL(connectionString)
    adminUrl.pathname = '/postgres'
    adminPool = new Pool({ connectionString: adminUrl.toString() })
    await adminPool.query(`CREATE DATABASE "${databaseName}"`)

    const testUrl = new URL(connectionString)
    testUrl.pathname = `/${databaseName}`
    pool = new Pool({ connectionString: testUrl.toString() })
    await runMigrations(pool, migrationsDir)
    repository = createRepository(pool)
  })

  afterAll(async () => {
    if (pool) await pool.end()
    if (adminPool) {
      await adminPool.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`)
      await adminPool.end()
    }
  })

  it('applies each migration exactly once', async () => {
    const secondRun = await runMigrations(pool, migrationsDir)
    expect(secondRun).toEqual([])

    const { rows } = await pool.query(
      'SELECT filename FROM schema_migrations ORDER BY filename',
    )
    expect(rows.map(({ filename }) => filename)).toEqual([
      '001_initial.sql',
      '002_catalog_indexes.sql',
      '003_catalog_management.sql',
    ])
  })

  it('covers the main catalog lifecycle and filters', async () => {
    const created = await repository.create({
      id: 'integration-dot',
      title: 'Integration Dot',
      code: 'dot-code',
      description: 'Test item',
      tags: ['compact', 'test'],
      color: 'green',
      type: 'dot',
      image: 'https://cdn.example.test/integration-full.webp',
      imageKey: 'crosshairs/integration-full.webp',
      status: 'published',
      featured: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    expect(created.copies).toBe(0)
    expect(created.featured).toBe(true)
    expect(created.images.thumbnail).toContain('integration-thumb.webp')

    const page = await repository.list({
      query: 'integration',
      tag: 'compact',
      color: 'green',
      type: 'dot',
    })
    expect(page.total).toBe(1)
    expect(page.items[0].id).toBe(created.id)
    await expect(repository.findMany([created.id])).resolves.toHaveLength(1)
    await expect(repository.related(created.id)).resolves.toEqual([])

    const copied = await repository.incrementCopies(created.id)
    expect(copied.copies).toBe(1)

    const updated = await repository.update(created.id, {
      ...created,
      title: 'Updated Integration Dot',
      color: 'white',
      status: 'draft',
      featured: false,
      imageKey: 'crosshairs/integration-full.webp',
    })
    expect(updated.title).toBe('Updated Integration Dot')
    expect(updated.color).toBe('white')
    expect(updated.status).toBe('draft')
    expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(Date.parse(created.updatedAt))

    await expect(repository.find(created.id)).resolves.toBeNull()
    const found = await repository.find(created.id, { includeDrafts: true })
    expect(found.imageKey).toBe('crosshairs/integration-full.webp')

    await expect(repository.delete(created.id)).resolves.toEqual({
      image_key: 'crosshairs/integration-full.webp',
    })
    await expect(repository.find(created.id)).resolves.toBeNull()
  })
})
