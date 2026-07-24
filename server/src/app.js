import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import multer from 'multer'
import { z } from 'zod'
import { passwordMatches } from './session.js'

const cookieName = 'fragpunk_crosshairs_admin'
const mediaKeyPattern = /^crosshair-[a-zA-Z0-9-]+\.webp$/
const crosshairColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'white', 'black']
const crosshairTypes = ['circle', 'dot', 'square', 'cross']
const galleryQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
  q: z.string().trim().max(100).default(''),
  tag: z.string().trim().max(30).default(''),
  color: z.enum(['', ...crosshairColors]).default(''),
  type: z.enum(['', 'none', ...crosshairTypes]).default(''),
  sort: z.enum(['popular', 'new']).default('popular'),
})
const crosshairInput = z.object({
  title: z.string().trim().min(1).max(80),
  code: z.string().trim().min(1).max(4000),
  description: z.string().trim().max(300).default(''),
  color: z.enum(crosshairColors),
  type: z.preprocess(
    (value) => value == null || value === '' ? null : value,
    z.enum(crosshairTypes).nullable(),
  ),
  tags: z.string().default('').transform((value) =>
    [...new Set(value.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
      .filter((tag) => tag.length <= 30)
      .slice(0, 8),
  ),
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, fieldSize: 8 * 1024, files: 1, fields: 8, parts: 9 },
})

const log = (level, message, details = {}) => {
  const entry = { timestamp: new Date().toISOString(), level, message, ...details }
  const output = JSON.stringify(entry)
  if (level === 'error') console.error(output)
  else console.log(output)
}

const escapeMarkup = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

export const createApp = ({ config, repository, storage, rateLimits, sessionManager, distDir }) => {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.TRUST_PROXY)

  app.use((request, response, next) => {
    request.id = request.get('x-request-id') || crypto.randomUUID()
    response.setHeader('X-Request-ID', request.id)
    next()
  })
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: config.HTTPS_ENABLED ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: config.HTTPS_ENABLED
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
  }))
  app.use(compression())
  app.use(express.json({ limit: '32kb' }))
  app.use(cookieParser())

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.HTTPS_ENABLED,
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  }
  const hasSession = (request) => sessionManager.verify(request.cookies[cookieName])
  const requireAdmin = (request, response, next) => {
    if (!hasSession(request)) {
      return response.status(401).json({ code: 'unauthorized', error: 'Administrator login required' })
    }
    next()
  }
  const requireTrustedMutation = (request, response, next) => {
    const origin = request.get('origin')
    if (origin && origin !== config.PUBLIC_ORIGIN) {
      return response.status(403).json({ code: 'untrustedOrigin', error: 'Untrusted request origin' })
    }
    if (request.get('x-admin-request') !== '1') {
      return response.status(403).json({ code: 'missingAdminHeader', error: 'Missing admin request header' })
    }
    next()
  }

  app.get('/robots.txt', (_request, response) => {
    response.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${config.PUBLIC_ORIGIN}/sitemap.xml\n`)
  })

  app.get('/sitemap.xml', async (_request, response, next) => {
    try {
      const items = await repository.listIds()
      const urls = [
        `<url><loc>${escapeMarkup(config.PUBLIC_ORIGIN)}/</loc></url>`,
        ...items.map((item) =>
          `<url><loc>${escapeMarkup(config.PUBLIC_ORIGIN)}/crosshairs/${encodeURIComponent(item.id)}</loc><lastmod>${item.createdAt.slice(0, 10)}</lastmod></url>`),
      ]
      response.type('application/xml').send(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
      )
    } catch (error) {
      next(error)
    }
  })

  app.get('/healthz', async (_request, response) => {
    try {
      await Promise.all([repository.health(), rateLimits.health(), storage.health()])
      response.setHeader('Cache-Control', 'no-store')
      response.json({ status: 'ok' })
    } catch (error) {
      log('error', 'Health check failed', { error: error.message })
      response.status(503).json({ status: 'unavailable' })
    }
  })

  app.get('/api/crosshairs', async (_request, response, next) => {
    try {
      const query = galleryQuery.parse(_request.query)
      const filters = {
        page: query.page,
        limit: query.limit,
        query: query.q,
        tag: query.tag,
        color: query.color,
        type: query.type,
        sort: query.sort,
      }
      const [result, tags, stats] = await Promise.all([
        repository.list(filters),
        repository.listTags(),
        repository.stats(),
      ])
      response.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
      response.json({ ...result, tags, stats })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/crosshairs/:id', async (request, response, next) => {
    try {
      const item = await repository.find(request.params.id)
      if (!item) return response.status(404).json({ code: 'notFound', error: 'Crosshair not found' })
      response.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      response.json(item)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/admin/session', (request, response) => {
    response.setHeader('Cache-Control', 'no-store')
    response.json({ authenticated: hasSession(request) })
  })

  app.get('/api/admin/crosshairs', requireAdmin, async (_request, response, next) => {
    try {
      response.setHeader('Cache-Control', 'no-store')
      response.json(await repository.listAll())
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/admin/login', requireTrustedMutation, async (request, response, next) => {
    try {
      const attempt = await rateLimits.checkLogin(request)
      if (!attempt.allowed) {
        return response.status(429).json({ code: 'rateLimited', error: 'Too many attempts' })
      }
      if (!passwordMatches(request.body?.password || '', config.ADMIN_PASSWORD)) {
        return response.status(401).json({ code: 'wrongPassword', error: 'Incorrect password' })
      }
      await rateLimits.clearLogin(attempt.key)
      response.cookie(cookieName, sessionManager.create(), cookieOptions)
      response.json({ authenticated: true })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/admin/logout', requireTrustedMutation, (_request, response) => {
    response.clearCookie(cookieName, cookieOptions)
    response.json({ authenticated: false })
  })

  app.post(
    '/api/crosshairs',
    requireAdmin,
    requireTrustedMutation,
    upload.single('screenshot'),
    async (request, response, next) => {
      let storedImage
      try {
        const parsed = crosshairInput.parse(request.body)
        if (!request.file) {
          return response.status(400).json({ code: 'required', error: 'Screenshot is required' })
        }
        storedImage = await storage.putScreenshot(request.file.buffer)
        const createdAt = new Date().toISOString()
        const item = await repository.create({
          id: crypto.randomUUID(),
          ...parsed,
          image: storedImage.url,
          imageKey: storedImage.key,
          createdAt,
        })
        response.status(201).json(item)
      } catch (error) {
        if (storedImage?.key) {
          try {
            await storage.delete(storedImage.key)
          } catch (cleanupError) {
            log('error', 'Failed to clean up orphan image', { error: cleanupError.message, requestId: request.id })
          }
        }
        next(error)
      }
    },
  )

  app.patch(
    '/api/crosshairs/:id',
    requireAdmin,
    requireTrustedMutation,
    upload.single('screenshot'),
    async (request, response, next) => {
      let replacementImage
      let committed = false
      try {
        const existing = await repository.find(request.params.id)
        if (!existing) return response.status(404).json({ code: 'notFound', error: 'Crosshair not found' })

        const parsed = crosshairInput.parse(request.body)
        if (request.file) replacementImage = await storage.putScreenshot(request.file.buffer)

        const updated = await repository.update(request.params.id, {
          ...parsed,
          image: replacementImage?.url || existing.image,
          imageKey: replacementImage?.key || existing.imageKey,
        })
        if (!updated) {
          return response.status(404).json({ code: 'notFound', error: 'Crosshair not found' })
        }
        committed = true

        if (replacementImage && existing.imageKey) {
          try {
            await storage.delete(existing.imageKey)
          } catch (error) {
            log('error', 'Failed to delete replaced image object', {
              error: error.message,
              imageKey: existing.imageKey,
              requestId: request.id,
            })
          }
        }
        response.json(updated)
      } catch (error) {
        next(error)
      } finally {
        if (replacementImage?.key && !committed) {
          try {
            await storage.delete(replacementImage.key)
          } catch (cleanupError) {
            log('error', 'Failed to clean up replacement image', {
              error: cleanupError.message,
              requestId: request.id,
            })
          }
        }
      }
    },
  )

  app.post('/api/crosshairs/:id/copy', async (request, response, next) => {
    try {
      const existing = await repository.find(request.params.id)
      if (!existing) return response.status(404).json({ code: 'notFound', error: 'Crosshair not found' })
      const counted = await rateLimits.acceptCopy(request, request.params.id)
      const item = counted
        ? await repository.incrementCopies(request.params.id)
        : existing
      response.json({ copies: item.copies, counted })
    } catch (error) {
      next(error)
    }
  })

  app.delete('/api/crosshairs/:id', requireAdmin, requireTrustedMutation, async (request, response, next) => {
    try {
      const deleted = await repository.delete(request.params.id)
      if (!deleted) return response.status(404).json({ code: 'notFound', error: 'Crosshair not found' })
      if (deleted.image_key) {
        try {
          await storage.delete(deleted.image_key)
        } catch (error) {
          log('error', 'Failed to delete image object', { error: error.message, imageKey: deleted.image_key })
        }
      }
      response.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  app.get('/media/:key', async (request, response, next) => {
    try {
      if (!mediaKeyPattern.test(request.params.key)) return response.status(404).end()
      const object = await storage.get(request.params.key)
      response.setHeader('Content-Type', object.ContentType || 'image/webp')
      response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      if (object.ContentLength) response.setHeader('Content-Length', object.ContentLength)
      object.Body.on('error', next).pipe(response)
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) return response.status(404).end()
      next(error)
    }
  })

  if (distDir && fs.existsSync(distDir)) {
    const assetsDir = path.join(distDir, 'assets')
    const indexTemplate = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
    app.use('/assets', express.static(assetsDir, { maxAge: '1y', immutable: true }))
    app.use(express.static(distDir, { index: false, maxAge: '1h' }))
    const sendApp = (request, response) => {
      response.setHeader('Cache-Control', 'no-store')
      response.setHeader('Link', `<${config.PUBLIC_ORIGIN}${request.path === '/admin' ? '/admin' : '/'}>; rel="canonical"`)
      if (request.path === '/admin') response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
      response.sendFile(path.join(distDir, 'index.html'))
    }
    app.get('/', sendApp)
    app.get('/admin', sendApp)
    app.get('/crosshairs/:id', async (request, response, next) => {
      try {
        const item = await repository.find(request.params.id)
        if (!item) return response.status(404).type('html').send(indexTemplate)
        const title = escapeMarkup(`${item.title} — Fragpunk Crosshairs`)
        const description = escapeMarkup(item.description || `FragPunk crosshair code: ${item.title}`)
        const canonical = `${config.PUBLIC_ORIGIN}/crosshairs/${encodeURIComponent(item.id)}`
        const image = item.image.startsWith('http') ? item.image : `${config.PUBLIC_ORIGIN}${item.image}`
        const html = indexTemplate
          .replace('<title>Fragpunk Crosshairs</title>', `<title>${title}</title>`)
          .replace(
            /<meta name="description" content="[^"]*"\s*\/>/,
            `<meta name="description" content="${description}" />`,
          )
          .replace(
            '<meta property="og:title" content="Fragpunk Crosshairs" />',
            `<meta property="og:title" content="${title}" />`,
          )
          .replace(
            /<meta property="og:description" content="[^"]*"\s*\/>/,
            `<meta property="og:description" content="${description}" /><meta property="og:image" content="${escapeMarkup(image)}" /><meta property="og:url" content="${escapeMarkup(canonical)}" />`,
          )
          .replace('</head>', `<link rel="canonical" href="${escapeMarkup(canonical)}" /></head>`)
        response.setHeader('Cache-Control', 'no-store')
        response.type('html').send(html)
      } catch (error) {
        next(error)
      }
    })
  }

  app.use((request, response) => {
    response.status(404).json({ code: 'notFound', error: 'Not found', path: request.path })
  })

  app.use((error, request, response, _next) => {
    const isValidationError = error instanceof z.ZodError
    const isUploadLimit = error.code === 'LIMIT_FILE_SIZE'
    const code = error.translationCode || (isValidationError ? 'invalidForm' : isUploadLimit ? 'fileTooLarge' : 'generic')
    const status = isValidationError || isUploadLimit || error.translationCode ? 400 : 500
    log('error', 'Request failed', {
      requestId: request.id,
      method: request.method,
      path: request.path,
      code,
      error: error.message,
    })
    response.status(status).json({
      code,
      error: status === 500 ? 'Internal server error' : error.message,
      requestId: request.id,
    })
  })

  return app
}
