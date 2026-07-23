import crypto from 'node:crypto'

const safeEqual = (firstValue, secondValue) => {
  const first = Buffer.from(String(firstValue))
  const second = Buffer.from(String(secondValue))
  return first.length === second.length && crypto.timingSafeEqual(first, second)
}

export const passwordMatches = (provided, expected) => safeEqual(provided, expected)

export const createSessionManager = (secret, lifetimeMs = 12 * 60 * 60 * 1000) => {
  const sign = (value) =>
    crypto.createHmac('sha256', secret).update(value).digest('base64url')

  return {
    create() {
      const payload = Buffer.from(JSON.stringify({
        role: 'admin',
        expires: Date.now() + lifetimeMs,
        nonce: crypto.randomBytes(12).toString('base64url'),
      })).toString('base64url')
      return `${payload}.${sign(payload)}`
    },

    verify(value) {
      const [payload, signature] = String(value || '').split('.')
      if (!payload || !signature || !safeEqual(sign(payload), signature)) return false
      try {
        const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString())
        return parsed.role === 'admin' && parsed.expires > Date.now()
      } catch {
        return false
      }
    },
  }
}
