import crypto from 'node:crypto'
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { imageVariantKeys, imageVariantsFromUrl } from './image-variants.js'

const allowedFormats = new Set(['jpeg', 'png', 'webp'])
const maxPixels = 40_000_000

export const processScreenshotVariants = async (input) => {
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
  const normalized = image.rotate()
  const [thumbnail, card, full] = await Promise.all([
    normalized.clone()
      .resize({ width: 480, height: 270, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer(),
    normalized.clone()
      .resize({ width: 960, height: 540, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer(),
    normalized.clone()
      .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84, effort: 4 })
      .toBuffer(),
  ])
  return { thumbnail, card, full }
}

export const processScreenshot = async (input) => (await processScreenshotVariants(input)).full

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
      const processed = await processScreenshotVariants(buffer)
      const base = `crosshair-${Date.now()}-${crypto.randomUUID()}`
      const objects = [
        { key: `${base}-thumb.webp`, body: processed.thumbnail },
        { key: `${base}-card.webp`, body: processed.card },
        { key: `${base}-full.webp`, body: processed.full },
      ]
      const uploaded = []
      try {
        for (const object of objects) {
          await client.send(new PutObjectCommand({
            Bucket: config.S3_BUCKET,
            Key: object.key,
            Body: object.body,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
          }))
          uploaded.push(object.key)
        }
      } catch (error) {
        if (uploaded.length) {
          await client.send(new DeleteObjectsCommand({
            Bucket: config.S3_BUCKET,
            Delete: { Objects: uploaded.map((Key) => ({ Key })), Quiet: true },
          })).catch(() => undefined)
        }
        throw error
      }
      const key = `${base}-full.webp`
      const url = `/media/${key}`
      return { key, url, images: imageVariantsFromUrl(url) }
    },

    async get(key) {
      return client.send(new GetObjectCommand({ Bucket: config.S3_BUCKET, Key: key }))
    },

    async delete(key) {
      if (!key) return
      const keys = imageVariantKeys(key)
      if (keys.length === 1) {
        await client.send(new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: key }))
        return
      }
      await client.send(new DeleteObjectsCommand({
        Bucket: config.S3_BUCKET,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }))
    },

    async health() {
      await client.send(new HeadBucketCommand({ Bucket: config.S3_BUCKET }))
    },

    close() {
      client.destroy()
    },
  }
}
