import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchJson } from '../lib/api'
import { CrosshairAttributes, Icon, SiteHeader } from './UI'

export default function CrosshairPage({ id, onCopy }) {
  const { t } = useTranslation()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchJson(`/api/crosshairs/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((result) => {
        setItem(result)
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
              <img src={item.image} alt={`${t('gallery.game')} — ${item.title}`} />
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
              <div className="how-to">
                <span>01</span>
                <p><strong>{t('detail.step')}</strong>{t('detail.instruction')}</p>
              </div>
            </div>
          </article>
        )}
      </main>
    </>
  )
}
