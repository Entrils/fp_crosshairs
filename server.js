import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import { createClient } from 'redis'
import { createApp } from './backend/app.js'
import { loadConfig } from './backend/config.js'
import { createRateLimits } from './backend/rate-limits.js'
import { createRepository } from './backend/repository.js'
import { createSessionManager } from './backend/session.js'
import { createStorage } from './backend/storage.js'

const projectDir = path.dirname(fileURLToPath(import.meta.url))

const start = async () => {
  const config = loadConfig()
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
    ssl: config.DATABASE_SSL
      ? { rejectUnauthorized: config.DATABASE_SSL_REJECT_UNAUTHORIZED }
      : false,
  })
  const redis = createClient({ url: config.REDIS_URL })
  redis.on('error', (error) => {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message: 'Redis error', error: error.message }))
  })
  await redis.connect()

  const repository = createRepository(pool)
  const storage = createStorage(config)
  const rateLimits = createRateLimits(redis, config.SESSION_SECRET)
  const sessionManager = createSessionManager(config.SESSION_SECRET)

  await repository.migrate()
  await repository.seedFromFile(path.join(projectDir, 'data', 'crosshairs.json'))
  await storage.initialize()

  const app = createApp({
    config,
    repository,
    storage,
    rateLimits,
    sessionManager,
    distDir: path.join(projectDir, 'dist'),
  })
  const server = app.listen(config.PORT, () => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Fragpunk Crosshairs started',
      port: config.PORT,
      environment: config.NODE_ENV,
    }))
  })

  let shuttingDown = false
  const shutdown = async (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message: 'Shutting down', signal }))
    const forceExit = setTimeout(() => process.exit(1), 10_000)
    forceExit.unref()
    server.close(async () => {
      await Promise.allSettled([repository.close(), rateLimits.close()])
      storage.close()
      process.exit(0)
    })
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

start().catch((error) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'fatal',
    message: 'Failed to start application',
    error: error.message,
  }))
  process.exit(1)
})
