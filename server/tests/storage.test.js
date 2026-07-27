import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { processScreenshot, processScreenshotVariants } from '../src/storage.js'

describe('screenshot processing', () => {
  it('normalizes images to bounded WebP files', async () => {
    const source = await sharp({
      create: { width: 2400, height: 1400, channels: 3, background: '#777777' },
    }).png().toBuffer()

    const output = await processScreenshot(source)
    const metadata = await sharp(output).metadata()

    expect(metadata.format).toBe('webp')
    expect(metadata.width).toBeLessThanOrEqual(1920)
    expect(metadata.height).toBeLessThanOrEqual(1080)
  })

  it('creates responsive thumbnail, card, and full variants', async () => {
    const source = await sharp({
      create: { width: 2400, height: 1400, channels: 3, background: '#777777' },
    }).png().toBuffer()

    const variants = await processScreenshotVariants(source)
    const [thumbnail, card, full] = await Promise.all(
      [variants.thumbnail, variants.card, variants.full].map((buffer) => sharp(buffer).metadata()),
    )

    expect(thumbnail.width).toBeLessThanOrEqual(480)
    expect(card.width).toBeLessThanOrEqual(960)
    expect(full.width).toBeLessThanOrEqual(1920)
  })

  it('rejects non-image input', async () => {
    await expect(processScreenshot(Buffer.from('not an image'))).rejects.toThrow()
  })
})
