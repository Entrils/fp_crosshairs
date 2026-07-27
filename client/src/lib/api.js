export const colorOptions = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'white', 'black']
export const typeOptions = ['circle', 'dot', 'square', 'cross']

export const fetchJson = async (url, options) => {
  const response = await fetch(url, options)
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.error || `HTTP ${response.status}`)
  return result
}

export const fetchGallery = (filters, options = {}) => {
  const parameters = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit || 12),
    q: filters.query,
    tag: filters.tag === 'all' ? '' : filters.tag,
    color: filters.color === 'all' ? '' : filters.color,
    type: filters.type === 'all' ? '' : filters.type,
    sort: filters.sort,
  })
  return fetchJson(`/api/crosshairs?${parameters}`, options)
}

export const formatCopies = (value) => {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return value
}

export const responsiveImageProps = (item, variant = 'full', sizes) => {
  const images = item.images
  const props = { src: images?.[variant] || item.image }
  if (images?.srcSet) {
    props.srcSet = images.srcSet
    if (sizes) props.sizes = sizes
  }
  return props
}
