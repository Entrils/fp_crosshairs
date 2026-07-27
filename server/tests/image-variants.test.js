import { describe, expect, it } from 'vitest'
import { imageVariantKeys, imageVariantsFromUrl } from '../src/image-variants.js'

describe('responsive image variants', () => {
  it('derives responsive URLs from a full image URL', () => {
    expect(imageVariantsFromUrl('/media/crosshair-demo-full.webp')).toEqual({
      thumbnail: '/media/crosshair-demo-thumb.webp',
      card: '/media/crosshair-demo-card.webp',
      full: '/media/crosshair-demo-full.webp',
      srcSet: '/media/crosshair-demo-thumb.webp 480w, /media/crosshair-demo-card.webp 960w, /media/crosshair-demo-full.webp 1920w',
    })
  })

  it('keeps legacy images compatible', () => {
    expect(imageVariantsFromUrl('/previews/demo.svg')).toEqual({
      thumbnail: '/previews/demo.svg',
      card: '/previews/demo.svg',
      full: '/previews/demo.svg',
      srcSet: '',
    })
  })

  it('derives every object key for cleanup', () => {
    expect(imageVariantKeys('crosshair-demo-full.webp')).toEqual([
      'crosshair-demo-thumb.webp',
      'crosshair-demo-card.webp',
      'crosshair-demo-full.webp',
    ])
  })
})
