import { createClient } from 'redis'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRateLimits } from '../src/rate-limits.js'

const redisUrl = process.env.TEST_REDIS_URL
const describeWithRedis = redisUrl ? describe : describe.skip

describeWithRedis('Redis rate-limit integration', () => {
  let redis
  let rateLimits
  const identity = `${process.pid}-${Date.now()}`
  const request = {
    ip: `test-${identity}`,
    get: () => `vitest-${identity}`,
  }

  beforeAll(async () => {
    redis = createClient({ url: redisUrl })
    await redis.connect()
    rateLimits = createRateLimits(redis, 'integration-test-secret')
  })

  afterAll(async () => {
    if (rateLimits) await rateLimits.close()
  })

  it('limits repeated admin logins and can clear the counter', async () => {
    let result
    for (let index = 0; index < 8; index += 1) {
      result = await rateLimits.checkLogin(request)
      expect(result.allowed).toBe(true)
    }
    const blocked = await rateLimits.checkLogin(request)
    expect(blocked.allowed).toBe(false)

    await rateLimits.clearLogin(blocked.key)
    await expect(rateLimits.checkLogin(request)).resolves.toMatchObject({
      allowed: true,
    })
  })

  it('deduplicates copy events for the same visitor', async () => {
    await expect(rateLimits.acceptCopy(request, `crosshair-${identity}`)).resolves.toBe(true)
    await expect(rateLimits.acceptCopy(request, `crosshair-${identity}`)).resolves.toBe(false)
  })
})
