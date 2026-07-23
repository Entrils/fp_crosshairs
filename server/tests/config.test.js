import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.js'

const validEnvironment = {
  NODE_ENV: 'production',
  HTTPS_ENABLED: 'true',
  PORT: '4173',
  ADMIN_PASSWORD: 'a-long-production-password',
  SESSION_SECRET: 'a-secure-session-secret-with-32-characters',
  DATABASE_URL: 'postgresql://example.test/database',
  DATABASE_SSL: 'true',
  DATABASE_SSL_REJECT_UNAUTHORIZED: 'true',
  REDIS_URL: 'redis://example.test',
  S3_ENDPOINT: 'https://storage.example.test',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'crosshairs',
  S3_ACCESS_KEY_ID: 'access-key',
  S3_SECRET_ACCESS_KEY: 'secret-access-key',
  S3_FORCE_PATH_STYLE: 'false',
  S3_CREATE_BUCKET: 'false',
  PUBLIC_ORIGIN: 'https://crosshairs.example.test/',
  TRUST_PROXY: '1',
}

describe('environment configuration', () => {
  it('validates and normalizes production configuration', () => {
    const config = loadConfig(validEnvironment)
    expect(config.isProduction).toBe(true)
    expect(config.PUBLIC_ORIGIN).toBe('https://crosshairs.example.test')
    expect(config.DATABASE_SSL).toBe(true)
  })

  it('fails closed when secrets are missing', () => {
    const invalid = { ...validEnvironment }
    delete invalid.SESSION_SECRET
    expect(() => loadConfig(invalid)).toThrow(/SESSION_SECRET/)
  })
})
