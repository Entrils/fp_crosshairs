import path from 'node:path'
import { fileURLToPath } from 'node:url'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { createSessionManager } from '../src/session.js'

const serverDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const clientDir = path.join(path.dirname(serverDir), 'client')
const item = {
  id: 'demo',
  title: 'Demo',
  code: 'demo-code',
  description: '',
  tags: ['dot'],
  color: 'white',
  type: 'dot',
  image: '/previews/minimal-dot.svg',
  copies: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const config = {
  TRUST_PROXY: 0,
  PUBLIC_ORIGIN: 'https://example.test',
  ADMIN_PASSWORD: 'a-long-production-password',
  HTTPS_ENABLED: true,
  isProduction: true,
}

describe('production API', () => {
  let repository
  let storage
  let rateLimits
  let sessions
  let app

  beforeEach(() => {
    repository = {
      list: vi.fn().mockResolvedValue([item]),
      find: vi.fn().mockResolvedValue(item),
      create: vi.fn().mockResolvedValue(item),
      update: vi.fn().mockResolvedValue(item),
      incrementCopies: vi.fn().mockResolvedValue({ ...item, copies: 1 }),
      delete: vi.fn().mockResolvedValue({ image_key: null }),
      health: vi.fn().mockResolvedValue(undefined),
    }
    storage = {
      health: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(),
      delete: vi.fn(),
      putScreenshot: vi.fn(),
    }
    rateLimits = {
      health: vi.fn().mockResolvedValue(undefined),
      checkLogin: vi.fn().mockResolvedValue({ allowed: true, key: 'login:test' }),
      clearLogin: vi.fn().mockResolvedValue(undefined),
      acceptCopy: vi.fn().mockResolvedValue(true),
    }
    sessions = createSessionManager('a-secure-session-secret-with-32-characters')
    app = createApp({
      config,
      repository,
      storage,
      rateLimits,
      sessionManager: sessions,
      distDir: clientDir,
    })
  })

  it('returns health and security headers', async () => {
    const response = await request(app).get('/healthz')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.headers['content-security-policy']).toContain("default-src 'self'")
    expect(response.headers['strict-transport-security']).toBeTruthy()
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
  })

  it('protects administrative mutations', async () => {
    const response = await request(app).post('/api/crosshairs')
    expect(response.status).toBe(401)
  })

  it('requires the private admin request header', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send({ password: config.ADMIN_PASSWORD })
    expect(response.status).toBe(403)
    expect(response.body.code).toBe('missingAdminHeader')
  })

  it('creates an HttpOnly secure session after login', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .set('X-Admin-Request', '1')
      .send({ password: config.ADMIN_PASSWORD })
    expect(response.status).toBe(200)
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly')
    expect(response.headers['set-cookie'][0]).toContain('Secure')
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Strict')
  })

  it('returns the authoritative copy count', async () => {
    const response = await request(app).post('/api/crosshairs/demo/copy')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ copies: 1, counted: true })
    expect(repository.incrementCopies).toHaveBeenCalledWith('demo')
  })

  it('accepts authenticated uploads through the protected API', async () => {
    storage.putScreenshot.mockResolvedValue({ key: 'crosshair-test.webp', url: '/media/crosshair-test.webp' })
    const response = await request(app)
      .post('/api/crosshairs')
      .set('Cookie', `fragpunk_crosshairs_admin=${sessions.create()}`)
      .set('X-Admin-Request', '1')
      .field('title', 'Demo')
      .field('code', 'demo-code')
      .field('description', '')
      .field('tags', 'dot, white')
      .field('color', 'white')
      .field('type', '')
      .attach('screenshot', Buffer.from('mock-image'), 'preview.png')

    expect(response.status).toBe(201)
    expect(storage.putScreenshot).toHaveBeenCalled()
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      color: 'white',
      type: null,
    }))
  })

  it('rejects a color outside the supported list', async () => {
    const response = await request(app)
      .post('/api/crosshairs')
      .set('Cookie', `fragpunk_crosshairs_admin=${sessions.create()}`)
      .set('X-Admin-Request', '1')
      .field('title', 'Demo')
      .field('code', 'demo-code')
      .field('color', 'pink')
      .field('type', 'dot')
      .attach('screenshot', Buffer.from('mock-image'), 'preview.png')

    expect(response.status).toBe(400)
    expect(response.body.code).toBe('invalidForm')
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('updates an existing crosshair without replacing its screenshot', async () => {
    const response = await request(app)
      .patch('/api/crosshairs/demo')
      .set('Cookie', `fragpunk_crosshairs_admin=${sessions.create()}`)
      .set('X-Admin-Request', '1')
      .field('title', 'Updated demo')
      .field('code', 'updated-code')
      .field('description', 'Updated description')
      .field('tags', 'dot, white')
      .field('color', 'white')
      .field('type', '')

    expect(response.status).toBe(200)
    expect(storage.putScreenshot).not.toHaveBeenCalled()
    expect(repository.update).toHaveBeenCalledWith('demo', expect.objectContaining({
      title: 'Updated demo',
      color: 'white',
      type: null,
      image: item.image,
    }))
  })

  it('replaces the screenshot only after a successful update', async () => {
    repository.find.mockResolvedValue({ ...item, imageKey: 'crosshair-old.webp' })
    repository.update.mockResolvedValue({ ...item, image: '/media/crosshair-new.webp' })
    storage.putScreenshot.mockResolvedValue({
      key: 'crosshair-new.webp',
      url: '/media/crosshair-new.webp',
    })

    const response = await request(app)
      .patch('/api/crosshairs/demo')
      .set('Cookie', `fragpunk_crosshairs_admin=${sessions.create()}`)
      .set('X-Admin-Request', '1')
      .field('title', 'Updated demo')
      .field('code', 'updated-code')
      .field('description', '')
      .field('tags', 'dot')
      .field('color', 'blue')
      .field('type', 'circle')
      .attach('screenshot', Buffer.from('mock-image'), 'replacement.png')

    expect(response.status).toBe(200)
    expect(repository.update).toHaveBeenCalledWith('demo', expect.objectContaining({
      image: '/media/crosshair-new.webp',
      imageKey: 'crosshair-new.webp',
    }))
    expect(storage.delete).toHaveBeenCalledWith('crosshair-old.webp')
  })

  it('keeps the admin route out of search indexes', async () => {
    const response = await request(app).get('/admin')
    expect(response.status).toBe(200)
    expect(response.headers['x-robots-tag']).toContain('noindex')
  })
})
