import { useEffect, useState } from 'react'

const keys = {
  favorites: 'fragpunk-crosshairs-favorites',
  recent: 'fragpunk-crosshairs-recent',
}
const changeEvent = 'fragpunk-library-change'

const readIds = (kind) => {
  try {
    const value = JSON.parse(localStorage.getItem(keys[kind]) || '[]')
    return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

const writeIds = (kind, ids) => {
  localStorage.setItem(keys[kind], JSON.stringify(ids))
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: kind }))
}

export const toggleFavorite = (id) => {
  const ids = readIds('favorites')
  const next = ids.includes(id)
    ? ids.filter((entry) => entry !== id)
    : [id, ...ids].slice(0, 50)
  writeIds('favorites', next)
  return next.includes(id)
}

export const rememberRecent = (id) => {
  writeIds('recent', [id, ...readIds('recent').filter((entry) => entry !== id)].slice(0, 12))
}

export const useStoredIds = (kind) => {
  const [ids, setIds] = useState(() => readIds(kind))

  useEffect(() => {
    const sync = (event) => {
      if (!event.detail || event.detail === kind) setIds(readIds(kind))
    }
    const syncStorage = (event) => {
      if (event.key === keys[kind]) setIds(readIds(kind))
    }
    window.addEventListener(changeEvent, sync)
    window.addEventListener('storage', syncStorage)
    return () => {
      window.removeEventListener(changeEvent, sync)
      window.removeEventListener('storage', syncStorage)
    }
  }, [kind])

  return ids
}
