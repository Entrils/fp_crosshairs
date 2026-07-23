import crypto from 'node:crypto'
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const allowedFormats = new Set(['jpeg', 'png', 'webp'])
const maxPixels = 40_000_000

export const processScreenshot = async (input) => {
  const image = sharp(input, { failOn: 'warning', limitInputPixels: maxPixels })
  let metadata
  try {
    metadata = await image.metadata()
  } catch {
    throw Object.assign(new Error('Unsupported image'), { translationCode: 'invalidImage' })
  }
  if (!allowedFormats.has(metadata.format)) throw Object.assign(new Error('Unsupported image'), { translationCode: 'invalidImage' })
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > maxPixels) {
    throw Object.assign(new Error('Image dimensions are too large'), { translationCode: 'imageDimensions' })
  }
  return image
    .rotate()
    .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, effort: 4 })
    .toBuffer()
}

export const createStorage = (config) => {
  const client = new S3Client({
    endpoint: config.S3_ENDPOINT,
    region: config.S3_REGION,
    forcePathStyle: config.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY_ID,
      secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    },
  })

  return {
    async initialize() {
      try {
        await client.send(new HeadBucketCommand({ Bucket: config.S3_BUCKET }))
      } catch (error) {
        if (!config.S3_CREATE_BUCKET) throw error
        await client.send(new CreateBucketCommand({ Bucket: config.S3_BUCKET }))
      }
    },

    async putScreenshot(buffer) {
      const processed = await processScreenshot(buffer)
      const key = `crosshair-${Date.now()}-${crypto.randomUUID()}.webp`
      await client.send(new PutObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: key,
        Body: processed,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }))
      return { key, url: `/media/${key}` }
    },

    async get(key) {
      return client.send(new GetObjectCommand({ Bucket: config.S3_BUCKET, Key: key }))
    },

    async delete(key) {
      if (!key) return
      await client.send(new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: key }))
    },

    async health() {
      await client.send(new HeadBucketCommand({ Bucket: config.S3_BUCKET }))
    },

    close() {
      client.destroy()
    },
  }
}
