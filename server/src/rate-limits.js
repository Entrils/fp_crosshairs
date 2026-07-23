import crypto from 'node:crypto'

const digest = (secret, value) =>
  crypto.createHmac('sha256', secret).update(value).digest('base64url')

export const createRateLimits = (redis, secret) => ({
  async checkLogin(request) {
    const key = `login:${digest(secret, request.ip)}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, 15 * 60)
    return { allowed: count <= 8, key }
  },

  async clearLogin(key) {
    if (key) await redis.del(key)
  },

  async acceptCopy(request, crosshairId) {
    const identity = `${request.ip}|${request.get('user-agent') || 'unknown'}`
    const key = `copy:${crosshairId}:${digest(secret, identity)}`
    const result = await redis.set(key, '1', { NX: true, EX: 5 * 60 })
    return result === 'OK'
  },

  async health() {
    await redis.ping()
  },

  async close() {
    if (redis.isOpen) await redis.quit()
  },
})
