import { z } from 'zod'

const booleanFromEnv = (defaultValue = 'false') => z
  .enum(['true', 'false'])
  .default(defaultValue)
  .transform((value) => value === 'true')

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HTTPS_ENABLED: booleanFromEnv('true'),
  PORT: z.coerce.number().int().positive().default(4173),
  ADMIN_PASSWORD: z.string().min(16),
  SESSION_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: booleanFromEnv(),
  DATABASE_SSL_REJECT_UNAUTHORIZED: booleanFromEnv('true'),
  REDIS_URL: z.string().min(1),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(3),
  S3_ACCESS_KEY_ID: z.string().min(3),
  S3_SECRET_ACCESS_KEY: z.string().min(8),
  S3_FORCE_PATH_STYLE: booleanFromEnv(),
  S3_CREATE_BUCKET: booleanFromEnv(),
  PUBLIC_ORIGIN: z.string().url().transform((value) => new URL(value).origin),
  PUBLIC_CONTACT_EMAIL: z.union([z.literal(''), z.string().email()]).default(''),
  TRUST_PROXY: z.coerce.number().int().min(0).max(3).default(1),
  ADS_ENABLED: booleanFromEnv(),
  ADSENSE_CLIENT_ID: z.string().default(''),
  ADSENSE_HOME_SLOT: z.string().default(''),
  ADSENSE_DETAIL_SLOT: z.string().default(''),
}).superRefine((config, context) => {
  if (!config.ADS_ENABLED) return

  if (!/^ca-pub-\d{16}$/.test(config.ADSENSE_CLIENT_ID)) {
    context.addIssue({
      code: 'custom',
      path: ['ADSENSE_CLIENT_ID'],
      message: 'ADSENSE_CLIENT_ID must use the ca-pub-XXXXXXXXXXXXXXXX format when ads are enabled',
    })
  }

  for (const field of ['ADSENSE_HOME_SLOT', 'ADSENSE_DETAIL_SLOT']) {
    const value = config[field]
    if (value && !/^\d+$/.test(value)) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} must contain digits only when ads are enabled`,
      })
    }
  }
})

export const loadConfig = (environment = process.env) => {
  const result = schema.safeParse(environment)
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error(`Invalid environment configuration: ${fields}`)
  }
  return {
    ...result.data,
    isProduction: result.data.NODE_ENV === 'production',
  }
}
