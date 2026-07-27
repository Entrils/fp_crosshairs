import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import { createClient } from 'redis'
import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { createRateLimits } from './rate-limits.js'
import { createRepository } from './repository.js'
import { createSessionManager } from './session.js'
import { createStorage } from './storage.js'

const sourceDir = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.dirname(sourceDir)
const projectDir = path.dirname(serverDir)

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
  const redis = createClient({
    url: config.REDIS_URL,
    socket: {
      connectTimeout: 5_000,
      reconnectStrategy: (retries) => {
        if (retries >= 3) {
          return new Error('Redis is unavailable after 3 connection retries')
        }
        return Math.min(250 * (2 ** retries), 1_000)
      },
    },
  })
  redis.on('error', (error) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Redis error',
      error: error.message || error.errors?.[0]?.message || error.name,
      code: error.code || error.errors?.[0]?.code,
    }))
  })
  await redis.connect()

  const repository = createRepository(pool)
  const storage = createStorage(config)
  const rateLimits = createRateLimits(redis, config.SESSION_SECRET)
  const sessionManager = createSessionManager(config.SESSION_SECRET)

  await repository.migrate()
  await repository.seedFromFile(path.join(serverDir, 'data', 'crosshairs.json'))
  await storage.initialize()

  const app = createApp({
    config,
    repository,
    storage,
    rateLimits,
    sessionManager,
    distDir: path.join(projectDir, 'client', 'dist'),
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
