import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AdminPage from './components/AdminPanel'
import CrosshairPage from './components/CrosshairPage'
import Gallery from './components/Gallery'
import Hero from './components/Hero'
import { Brand, Icon, SiteHeader, Toast } from './components/UI'

const crosshairPath = /^\/crosshairs\/([^/]+)\/?$/

const Guide = () => {
  const { t } = useTranslation()
  return (
    <section className="install-section" id="guide">
      <div className="install-copy"><span className="section-index">{t('guide.index')}</span><h2>{t('guide.title1')}<br /><em>{t('guide.title2')}</em></h2><p>{t('guide.subtitle')}</p></div>
      <div className="steps">
        <div><span>01</span><Icon name="copy" /><h3>{t('guide.copyTitle')}</h3><p>{t('guide.copyText')}</p></div>
        <div><span>02</span><Icon name="crosshair" /><h3>{t('guide.settingsTitle')}</h3><p>{t('guide.settingsText')}</p></div>
        <div><span>03</span><Icon name="upload" /><h3>{t('guide.importTitle')}</h3><p>{t('guide.importText')}</p></div>
      </div>
    </section>
  )
}

const Footer = () => {
  const { t } = useTranslation()
  return (
    <footer>
      <Brand />
      <p>{t('footer.disclaimer')}</p>
      <span>© 2026 Fragpunk Crosshairs</span>
    </footer>
  )
}

export default function App() {
  const { t } = useTranslation()
  const [toast, setToast] = useState('')
  const [stats, setStats] = useState({ total: null, copies: 0 })
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'
  const crosshairMatch = window.location.pathname.match(crosshairPath)

  useEffect(() => {
    if (normalizedPath === '/') document.title = 'Fragpunk Crosshairs'
  }, [normalizedPath])

  const notify = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }, [])

  const copyCode = useCallback(async (item) => {
    try {
      await navigator.clipboard.writeText(item.code)
    } catch {
      notify(t('errors.clipboard'))
      return null
    }
    notify(t('toast.copied'))
    try {
      const response = await fetch(`/api/crosshairs/${item.id}/copy`, { method: 'POST' })
      if (response.ok) return response.json()
    } catch {
      // The code was copied successfully. The count will be refreshed later.
    }
    return { copies: item.copies || 0, counted: false }
  }, [notify, t])

  if (normalizedPath === '/admin') return <AdminPage />

  if (crosshairMatch) {
    return (
      <>
        <CrosshairPage id={decodeURIComponent(crosshairMatch[1])} onCopy={copyCode} />
        <Toast message={toast} />
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Hero stats={stats} />
        <Gallery onCopy={copyCode} onStatsChange={setStats} />
        <Guide />
      </main>
      <Footer />
      <Toast message={toast} />
    </>
  )
}
