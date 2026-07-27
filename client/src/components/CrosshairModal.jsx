import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { responsiveImageProps } from '../lib/api'
import { CrosshairAttributes, Icon } from './UI'

export default function CrosshairModal({
  item,
  onClose,
  onCopy,
  onShare,
  favorite,
  onToggleFavorite,
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const focusable = () => [...modalRef.current.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])')]
    focusable()[0]?.focus()
    const handleKey = (event) => {
      if (event.key === 'Escape') return onClose()
      if (event.key !== 'Tab') return
      const elements = focusable()
      if (!elements.length) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      previouslyFocused?.focus()
    }
  }, [onClose])

  const copy = async () => {
    if (await onCopy(item)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div ref={modalRef} className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="crosshair-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label={t('common.close')}><Icon name="close" /></button>
        <div className="detail-modal__visual">
          <img
            {...responsiveImageProps(item, 'full', '(max-width: 950px) 100vw, 50vw')}
            alt={`${t('gallery.game')} — ${item.title}`}
            decoding="async"
          />
          <span className="visual-label">{t('detail.preview')}</span>
        </div>
        <div className="detail-modal__content">
          <span className="eyebrow">{t('detail.eyebrow')}</span>
          <h2 id="crosshair-dialog-title">{item.title}</h2>
          <p>{t(`seed.${item.id}`, { defaultValue: item.description || t('detail.fallback') })}</p>
          <div className="tags tags--large">{item.tags.map((tag) => <span className="tag" key={tag}>#{t(`tags.${tag}`, { defaultValue: tag })}</span>)}</div>
          <CrosshairAttributes item={item} />
          <div className="code-box">
            <code>{item.code}</code>
            <button onClick={copy} className={copied ? 'copied' : ''}><Icon name={copied ? 'check' : 'copy'} size={17} />{copied ? t('common.copiedCode') : t('common.copyCode')}</button>
          </div>
          <div className="detail-actions">
            <a href={`/crosshairs/${encodeURIComponent(item.id)}`}>{t('detail.openPage')}<Icon name="arrow" size={16} /></a>
            <button onClick={onToggleFavorite} aria-pressed={favorite}>
              <Icon name="heart" size={15} />
              {favorite ? t('common.removeFavorite') : t('common.addFavorite')}
            </button>
            <button onClick={() => onShare(item)}>
              <Icon name="share" size={15} />
              {t('common.share')}
            </button>
          </div>
          <div className="how-to">
            <span>01</span>
            <p><strong>{t('detail.step')}</strong>{t('detail.instruction')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
