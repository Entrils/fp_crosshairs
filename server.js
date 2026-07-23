import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import express from 'express'
import multer from 'multer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = Number(process.env.PORT) || 4173
const adminPassword = process.env.ADMIN_PASSWORD || 'fragpunk-admin'
const sessionSecret = process.env.SESSION_SECRET || 'dev-only-change-this-secret'
const dataDir = path.join(__dirname, 'data')
const dataFile = path.join(dataDir, 'crosshairs.json')
const uploadDir = path.join(__dirname, 'uploads')

fs.mkdirSync(dataDir, { recursive: true })
fs.mkdirSync(uploadDir, { recursive: true })

if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET)) {
  throw new Error('В production необходимо задать ADMIN_PASSWORD и SESSION_SECRET')
}

app.disable('x-powered-by')
app.use((_request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'same-origin')
  response.setHeader('X-Frame-Options', 'DENY')
  next()
})
app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())
app.use('/uploads', express.static(uploadDir, { maxAge: '7d', immutable: false }))

const safeEqual = (a, b) => {
  const first = Buffer.from(String(a))
  const second = Buffer.from(String(b))
  return first.length === second.length && crypto.timingSafeEqual(first, second)
}

const sign = (value) =>
  crypto.createHmac('sha256', sessionSecret).update(value).digest('base64url')

const makeSession = () => {
  const payload = Buffer.from(JSON.stringify({
    role: 'admin',
    expires: Date.now() + 1000 * 60 * 60 * 12,
  })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

const hasValidSession = (request) => {
  const [payload, signature] = String(request.cookies.fragpunk_crosshairs_admin || '').split('.')
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return false
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return parsed.role === 'admin' && parsed.expires > Date.now()
  } catch {
    return false
  }
}

const requireAdmin = (request, response, next) => {
  if (!hasValidSession(request)) {
    return response.status(401).json({ code: 'unauthorized', error: 'Требуется вход администратора' })
  }
  next()
}

const readCrosshairs = () => {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'))
  } catch {
    return []
  }
}

const writeCrosshairs = (items) => {
  const temporary = `${dataFile}.tmp`
  fs.writeFileSync(temporary, JSON.stringify(items, null, 2))
  fs.renameSync(temporary, dataFile)
}

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_request, file, callback) => {
    const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extensions[file.mimetype] || ''}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (allowedTypes.has(file.mimetype)) return callback(null, true)
    const error = new Error('Поддерживаются JPG, PNG и WEBP')
    error.translationCode = 'invalidImage'
    callback(error)
  },
})

const loginAttempts = new Map()
app.post('/api/admin/login', (request, response) => {
  const key = request.ip
  const attempt = loginAttempts.get(key) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 }
  if (Date.now() > attempt.resetAt) {
    attempt.count = 0
    attempt.resetAt = Date.now() + 15 * 60 * 1000
  }
  if (attempt.count >= 8) {
    return response.status(429).json({ code: 'rateLimited', error: 'Слишком много попыток. Попробуйте позже.' })
  }
  if (!safeEqual(request.body?.password || '', adminPassword)) {
    attempt.count += 1
    loginAttempts.set(key, attempt)
    return response.status(401).json({ code: 'wrongPassword', error: 'Неверный пароль' })
  }
  loginAttempts.delete(key)
  response.cookie('fragpunk_crosshairs_admin', makeSession(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 12,
  })
  response.json({ authenticated: true })
})

app.post('/api/admin/logout', (_request, response) => {
  response.clearCookie('fragpunk_crosshairs_admin')
  response.json({ authenticated: false })
})

app.get('/api/admin/session', (request, response) => {
  response.json({ authenticated: hasValidSession(request) })
})

app.get('/api/crosshairs', (_request, response) => {
  response.json(readCrosshairs())
})

app.post('/api/crosshairs', requireAdmin, upload.single('screenshot'), (request, response) => {
  const title = String(request.body.title || '').trim()
  const code = String(request.body.code || '').trim()
  const description = String(request.body.description || '').trim()
  const tags = String(request.body.tags || '')
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8)

  if (!title || !code || !request.file) {
    if (request.file) fs.unlinkSync(request.file.path)
    return response.status(400).json({ code: 'required', error: 'Укажите название, код и скриншот' })
  }
  if (title.length > 80 || code.length > 4000 || description.length > 300) {
    fs.unlinkSync(request.file.path)
    return response.status(400).json({ code: 'tooLong', error: 'Одно из полей слишком длинное' })
  }

  const items = readCrosshairs()
  const item = {
    id: crypto.randomUUID(),
    title,
    code,
    description,
    tags,
    image: `/uploads/${request.file.filename}`,
    copies: 0,
    createdAt: new Date().toISOString(),
  }
  items.unshift(item)
  writeCrosshairs(items)
  response.status(201).json(item)
})

app.post('/api/crosshairs/:id/copy', (request, response) => {
  const items = readCrosshairs()
  const item = items.find((entry) => entry.id === request.params.id)
  if (!item) return response.status(404).json({ code: 'notFound', error: 'Прицел не найден' })
  item.copies = Number(item.copies || 0) + 1
  writeCrosshairs(items)
  response.json({ copies: item.copies })
})

app.delete('/api/crosshairs/:id', requireAdmin, (request, response) => {
  const items = readCrosshairs()
  const item = items.find((entry) => entry.id === request.params.id)
  if (!item) return response.status(404).json({ code: 'notFound', error: 'Прицел не найден' })
  const remaining = items.filter((entry) => entry.id !== request.params.id)
  if (item.image.startsWith('/uploads/')) {
    const filename = path.basename(item.image)
    const target = path.join(uploadDir, filename)
    if (fs.existsSync(target)) fs.unlinkSync(target)
  }
  writeCrosshairs(remaining)
  response.status(204).end()
})

app.use((error, _request, response, _next) => {
  response.status(400).json({
    code: error.translationCode || (error.code === 'LIMIT_FILE_SIZE' ? 'fileTooLarge' : 'generic'),
    error: error.message || 'Не удалось обработать запрос',
  })
})

const distDir = path.join(__dirname, 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/.*/, (_request, response) => response.sendFile(path.join(distDir, 'index.html')))
}

app.listen(port, () => {
  console.log(`Fragpunk Crosshairs server: http://localhost:${port}`)
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('ВНИМАНИЕ: используется тестовый пароль fragpunk-admin. Задайте ADMIN_PASSWORD в окружении.')
  }
})
