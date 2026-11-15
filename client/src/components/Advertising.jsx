import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function AdUnit({ advertising, slot, placement }) {
  const { t } = useTranslation()
  const pushed = useRef(false)
  const [unfilled, setUnfilled] = useState(false)
  const unitRef = useRef(null)

  useEffect(() => {
    if (!advertising.enabled || !slot || pushed.current) return undefined
    pushed.current = true
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch {
      setUnfilled(true)
    }
    const unit = unitRef.current
    if (!unit) return undefined
    const observer = new MutationObserver(() => {
      setUnfilled(unit.dataset.adStatus === 'unfilled')
    })
    observer.observe(unit, { attributes: true, attributeFilter: ['data-ad-status'] })
    return () => observer.disconnect()
  }, [advertising.enabled, slot])

  if (!advertising.enabled || !slot) return null

  return (
    <aside className={`ad-placement ad-placement--${placement} ${unfilled ? 'ad-placement--unfilled' : ''}`} aria-label={t('ads.label')}>
      <span>{t('ads.label')}</span>
      <ins
        ref={unitRef}
        className="adsbygoogle"
        data-ad-client={advertising.clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  )
}
