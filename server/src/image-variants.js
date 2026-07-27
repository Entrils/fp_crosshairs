const variantPattern = /^(.*)-(?:thumb|card|full)\.webp$/

const variantName = (base, variant) => `${base}-${variant}.webp`

export const imageVariantsFromUrl = (url) => {
  const match = String(url || '').match(variantPattern)
  if (!match) {
    return {
      thumbnail: url,
      card: url,
      full: url,
      srcSet: '',
    }
  }
  const base = match[1]
  const thumbnail = variantName(base, 'thumb')
  const card = variantName(base, 'card')
  const full = variantName(base, 'full')
  return {
    thumbnail,
    card,
    full,
    srcSet: `${thumbnail} 480w, ${card} 960w, ${full} 1920w`,
  }
}

export const imageVariantKeys = (key) => {
  const match = String(key || '').match(variantPattern)
  if (!match) return key ? [key] : []
  return ['thumb', 'card', 'full'].map((variant) => variantName(match[1], variant))
}
