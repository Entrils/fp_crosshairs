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
    expect(config.ADS_ENABLED).toBe(false)
  })

  it('fails closed when secrets are missing', () => {
    const invalid = { ...validEnvironment }
    delete invalid.SESSION_SECRET
    expect(() => loadConfig(invalid)).toThrow(/SESSION_SECRET/)
  })

  it('requires a valid AdSense client only when advertising is enabled', () => {
    const disabledConfig = loadConfig({
      ...validEnvironment,
      ADS_ENABLED: 'false',
      ADSENSE_CLIENT_ID: 'replace-me',
      ADSENSE_HOME_SLOT: 'replace-me',
      ADSENSE_DETAIL_SLOT: 'replace-me',
    })
    expect(disabledConfig.ADS_ENABLED).toBe(false)

    expect(() => loadConfig({
      ...validEnvironment,
      ADS_ENABLED: 'true',
    })).toThrow(/ADSENSE_CLIENT_ID/)

    expect(() => loadConfig({
      ...validEnvironment,
      ADS_ENABLED: 'true',
      ADSENSE_CLIENT_ID: 'ca-pub-1234567890123456',
      ADSENSE_HOME_SLOT: 'replace-me',
    })).toThrow(/ADSENSE_HOME_SLOT/)

    const config = loadConfig({
      ...validEnvironment,
      ADS_ENABLED: 'true',
      ADSENSE_CLIENT_ID: 'ca-pub-1234567890123456',
      ADSENSE_HOME_SLOT: '1234567890',
    })
    expect(config.ADS_ENABLED).toBe(true)
    expect(config.ADSENSE_HOME_SLOT).toBe('1234567890')
  })
})
