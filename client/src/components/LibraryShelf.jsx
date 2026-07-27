import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchJson, responsiveImageProps } from '../lib/api'
import { useStoredIds } from '../lib/library'
import { CrosshairAttributes, Icon } from './UI'

const Shelf = ({ title, emptyText, items }) => (
  <div className="library-shelf">
    <h3>{title}</h3>
    {items.length ? (
      <div className="library-shelf__grid">
        {items.map((item) => (
          <a href={`/crosshairs/${encodeURIComponent(item.id)}`} className="library-card" key={item.id}>
            <img
              {...responsiveImageProps(item, 'thumbnail', '(max-width: 650px) 38vw, 180px')}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span>
              <strong>{item.title}</strong>
              <CrosshairAttributes item={item} />
            </span>
            <Icon name="arrow" size={16} />
          </a>
        ))}
      </div>
    ) : <p className="library-shelf__empty">{emptyText}</p>}
  </div>
)

export default function LibraryShelf() {
  const { t } = useTranslation()
  const favoriteIds = useStoredIds('favorites')
  const recentIds = useStoredIds('recent')
  const [items, setItems] = useState([])
  const ids = useMemo(
    () => [...new Set([...favoriteIds.slice(0, 6), ...recentIds.slice(0, 6)])],
    [favoriteIds, recentIds],
  )

  useEffect(() => {
    if (!ids.length) {
      setItems([])
      return undefined
    }
    const controller = new AbortController()
    const parameters = new URLSearchParams({ ids: ids.join(',') })
    fetchJson(`/api/crosshairs/batch?${parameters}`, { signal: controller.signal })
      .then((result) => setItems(result.items))
      .catch((error) => {
        if (error.name !== 'AbortError') setItems([])
      })
    return () => controller.abort()
  }, [ids])

  if (!favoriteIds.length && !recentIds.length) return null
  const byId = new Map(items.map((item) => [item.id, item]))
  const favorites = favoriteIds.map((id) => byId.get(id)).filter(Boolean).slice(0, 6)
  const recent = recentIds.map((id) => byId.get(id)).filter(Boolean).slice(0, 6)

  return (
    <section className="library-section" aria-labelledby="library-title">
      <div className="section-heading">
        <div>
          <h2 id="library-title">{t('library.title')}</h2>
          <p>{t('library.subtitle')}</p>
        </div>
      </div>
      <div className="library-columns">
        <Shelf title={t('library.favorites')} emptyText={t('library.noFavorites')} items={favorites} />
        <Shelf title={t('library.recent')} emptyText={t('library.noRecent')} items={recent} />
      </div>
    </section>
  )
}
