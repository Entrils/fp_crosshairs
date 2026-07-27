import { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCopies } from '../lib/api'
import { Icon } from './UI'

const HeroScene = lazy(() => import('../HeroScene'))

const DesktopHeroScene = () => {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 651px)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = navigator.connection
    let idleId
    let timeoutId

    const cancelPending = () => {
      if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId)
      if (timeoutId) window.clearTimeout(timeoutId)
      idleId = undefined
      timeoutId = undefined
    }

    const update = () => {
      cancelPending()
      setEnabled(false)
      const constrainedDevice = connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 2)
      if (!desktop.matches || reducedMotion.matches || constrainedDevice) return
      const show = () => setEnabled(true)
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(show, { timeout: 1500 })
      else timeoutId = window.setTimeout(show, 500)
    }

    update()
    desktop.addEventListener('change', update)
    reducedMotion.addEventListener('change', update)
    connection?.addEventListener?.('change', update)
    return () => {
      cancelPending()
      desktop.removeEventListener('change', update)
      reducedMotion.removeEventListener('change', update)
      connection?.removeEventListener?.('change', update)
    }
  }, [])

  if (!enabled) return null
  return <Suspense fallback={null}><HeroScene /></Suspense>
}

export default function Hero({ stats }) {
  const { t } = useTranslation()
  return (
    <section className="hero">
      <div className="hero__grid" />
      <div className="hero__noise" />
      <DesktopHeroScene />
      <div className="hero__copy">
        <div className="kicker"><span />{t('hero.kicker')}</div>
        <h1>{t('hero.title')} <em>{t('hero.accent')}</em></h1>
        <p className="hero__description">
          <span>{t('hero.line1')}</span>
          <span>{t('hero.line2')}</span>
        </p>
        <a href="#gallery" className="hero-button">{t('hero.cta')}<Icon name="arrow" /></a>
        <div className="hero__stats">
          <div><strong>{stats.total ?? '—'}</strong><span>{t('hero.crosshairs')}</span></div>
          <div><strong>{formatCopies(stats.copies || 0)}</strong><span>{t('hero.copies')}</span></div>
          <div><strong>100%</strong><span>{t('hero.free')}</span></div>
        </div>
      </div>
      <div className="hero__visual-meta" aria-hidden="true">
        <span>MONO / 3D SYSTEM</span>
        <i />
        <span>CALIBRATED 01</span>
      </div>
      <span className="hero__side-text" aria-hidden="true">AIM / CLICK / REPEAT</span>
    </section>
  )
}
