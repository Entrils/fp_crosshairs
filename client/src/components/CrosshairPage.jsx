import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchJson, responsiveImageProps } from '../lib/api'
import { rememberRecent, toggleFavorite, useStoredIds } from '../lib/library'
import { CrosshairAttributes, Icon, SiteHeader } from './UI'

export default function CrosshairPage({ id, onCopy, onShare }) {
  const { t } = useTranslation()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [related, setRelated] = useState([])
  const favoriteIds = useStoredIds('favorites')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      fetchJson(`/api/crosshairs/${encodeURIComponent(id)}`, { signal: controller.signal }),
      fetchJson(`/api/crosshairs/${encodeURIComponent(id)}/related`, { signal: controller.signal })
        .catch((requestError) => {
          if (requestError.name === 'AbortError') throw requestError
          return { items: [] }
        }),
    ])
      .then(([result, relatedResult]) => {
        setItem(result)
        setRelated(relatedResult.items)
        rememberRecent(result.id)
        document.title = `${result.title} — Fragpunk Crosshairs`
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [id])

  const copy = async () => {
    if (await onCopy(item)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="crosshair-page">
        {loading ? (
          <div className="crosshair-page__state skeleton" />
        ) : error || !item ? (
          <div className="empty-state"><Icon name="crosshair" size={42} /><h3>{t('gallery.emptyTitle')}</h3><a className="secondary-button" href="/#gallery">{t('detail.backGallery')}</a></div>
        ) : (
          <article className="crosshair-page__card">
            <div className="crosshair-page__visual">
              <img
                {...responsiveImageProps(item, 'full', '(max-width: 950px) 100vw, 58vw')}
                alt={`${t('gallery.game')} — ${item.title}`}
                decoding="async"
              />
              <span className="visual-label">{t('detail.preview')}</span>
            </div>
            <div className="crosshair-page__content">
              <a className="back-link" href="/#gallery">← {t('detail.backGallery')}</a>
              <span className="eyebrow">{t('detail.eyebrow')}</span>
              <h1>{item.title}</h1>
              <p>{t(`seed.${item.id}`, { defaultValue: item.description || t('detail.fallback') })}</p>
              <div className="tags tags--large">{item.tags.map((tag) => <span className="tag" key={tag}>#{t(`tags.${tag}`, { defaultValue: tag })}</span>)}</div>
              <CrosshairAttributes item={item} />
              <div className="code-box">
                <code>{item.code}</code>
                <button onClick={copy} className={copied ? 'copied' : ''}><Icon name={copied ? 'check' : 'copy'} size={17} />{copied ? t('common.copiedCode') : t('common.copyCode')}</button>
              </div>
              <div className="detail-actions detail-actions--page">
                <button onClick={() => toggleFavorite(item.id)} aria-pressed={favoriteIds.includes(item.id)}>
                  <Icon name="heart" size={16} />
                  {favoriteIds.includes(item.id) ? t('common.removeFavorite') : t('common.addFavorite')}
                </button>
                <button onClick={() => onShare(item)}>
                  <Icon name="share" size={16} />
                  {t('common.share')}
                </button>
              </div>
              <div className="how-to">
                <span>01</span>
                <p><strong>{t('detail.step')}</strong>{t('detail.instruction')}</p>
              </div>
            </div>
          </article>
        )}
        {!loading && !error && related.length > 0 && (
          <section className="related-section" aria-labelledby="related-title">
            <div>
              <h2 id="related-title">{t('detail.related')}</h2>
            </div>
            <div className="related-grid">
              {related.map((entry) => (
                <a href={`/crosshairs/${encodeURIComponent(entry.id)}`} key={entry.id}>
                  <img
                    {...responsiveImageProps(entry, 'thumbnail', '(max-width: 650px) 42vw, 220px')}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{entry.title}</span>
                  <Icon name="arrow" size={15} />
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
