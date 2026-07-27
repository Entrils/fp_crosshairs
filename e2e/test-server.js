import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from '../server/src/app.js'
import { createSessionManager } from '../server/src/session.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(path.dirname(currentDir), 'client', 'dist')
const now = Date.now()
let items = Array.from({ length: 13 }, (_, index) => ({
  id: `fixture-${index + 1}`,
  title: `Fixture Crosshair ${index + 1}`,
  code: `fixture-code-${index + 1}`,
  description: 'Playwright fixture',
  tags: index % 2 ? ['dot'] : ['circle'],
  color: index % 2 ? 'white' : 'green',
  type: index % 2 ? 'dot' : 'circle',
  image: '/previews/minimal-dot.svg',
  imageKey: null,
  copies: 13 - index,
  createdAt: new Date(now - index * 60_000).toISOString(),
  updatedAt: new Date(now - index * 60_000).toISOString(),
}))

const applyFilters = ({ query = '', tag = '', color = '', type = '', sort = 'popular' } = {}) => {
  const normalized = query.toLowerCase()
  return items
    .filter((item) => !normalized || item.title.toLowerCase().includes(normalized) || item.tags.some((value) => value.includes(normalized)))
    .filter((item) => !tag || item.tags.includes(tag))
    .filter((item) => !color || item.color === color)
    .filter((item) => !type || (type === 'none' ? !item.type : item.type === type))
    .sort((first, second) => sort === 'new'
      ? new Date(second.createdAt) - new Date(first.createdAt)
      : second.copies - first.copies || new Date(second.createdAt) - new Date(first.createdAt))
}

const repository = {
  async list(options = {}) {
    const filtered = applyFilters(options)
    const limit = options.limit || 12
    const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
    const page = Math.min(options.page || 1, totalPages)
    return {
      items: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
      totalPages,
    }
  },
  async listAll() {
    return [...items].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
  },
  async listTags() {
    const counts = new Map()
    items.flatMap((item) => item.tags).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1))
    return [...counts].map(([tag, count]) => ({ tag, count }))
  },
  async listIds() {
    return items.map(({ id, createdAt, updatedAt }) => ({ id, createdAt, updatedAt }))
  },
  async stats() {
    return { total: items.length, copies: items.reduce((sum, item) => sum + item.copies, 0) }
  },
  async adminStats() {
    return {
      total: items.length,
      published: items.filter((item) => item.status !== 'draft').length,
      drafts: items.filter((item) => item.status === 'draft').length,
      copies: items.reduce((sum, item) => sum + item.copies, 0),
      daily: [{ day: new Date().toISOString().slice(0, 10), copies: 4 }],
    }
  },
  async find(id) {
    return items.find((item) => item.id === id) || null
  },
  async findMany(ids) {
    return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean)
  },
  async related(id, limit) {
    return items.filter((item) => item.id !== id).slice(0, limit)
  },
  async create(item) {
    const created = { ...item, copies: 0 }
    items = [created, ...items]
    return created
  },
  async update(id, changes) {
    const index = items.findIndex((item) => item.id === id)
    if (index < 0) return null
    items[index] = { ...items[index], ...changes }
    return items[index]
  },
  async incrementCopies(id) {
    const item = items.find((entry) => entry.id === id)
    if (!item) return null
    item.copies += 1
    return item
  },
  async delete(id) {
    const index = items.findIndex((item) => item.id === id)
    if (index < 0) return null
    const [deleted] = items.splice(index, 1)
    return { image_key: deleted.imageKey }
  },
  async health() {},
}

const storage = {
  async initialize() {},
  async health() {},
  async putScreenshot() {
    return { key: `crosshair-e2e-${Date.now()}.webp`, url: '/previews/minimal-dot.svg' }
  },
  async delete() {},
  close() {},
}

const rateLimits = {
  async checkLogin() {
    return { allowed: true, key: 'e2e-login' }
  },
  async clearLogin() {},
  async acceptCopy() {
    return true
  },
  async health() {},
  async close() {},
}

const config = {
  TRUST_PROXY: 0,
  PUBLIC_ORIGIN: 'http://127.0.0.1:4188',
  ADMIN_PASSWORD: 'playwright-admin-password',
  HTTPS_ENABLED: false,
  isProduction: false,
}

const app = createApp({
  config,
  repository,
  storage,
  rateLimits,
  sessionManager: createSessionManager('playwright-session-secret-with-more-than-32-characters'),
  distDir,
})

const server = app.listen(4188, '127.0.0.1', () => {
  console.log('Playwright test server listening on http://127.0.0.1:4188')
})

const close = () => server.close(() => process.exit(0))
process.on('SIGINT', close)
process.on('SIGTERM', close)
