import { useEffect, useState } from 'react'
import { fetchJson } from './api'

const disabledAdvertising = {
  enabled: false,
  clientId: '',
  slots: { home: '', detail: '' },
}
const defaultPublicConfig = {
  advertising: disabledAdvertising,
  contactEmail: '',
}

const ensureAdSenseScript = (clientId) => {
  if (document.getElementById('adsense-script')) return
  const script = document.createElement('script')
  script.id = 'adsense-script'
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`
  document.head.append(script)
}

export const usePublicConfig = (active = true) => {
  const [publicConfig, setPublicConfig] = useState(defaultPublicConfig)

  useEffect(() => {
    if (!active) return undefined
    const controller = new AbortController()
    fetchJson('/api/public-config', { signal: controller.signal })
      .then((config) => {
        setPublicConfig({
          advertising: config.advertising || disabledAdvertising,
          contactEmail: config.contactEmail || '',
        })
        if (!config.advertising?.enabled || !config.advertising.clientId) return
        ensureAdSenseScript(config.advertising.clientId)
        if (!document.querySelector('meta[name="google-adsense-account"]')) {
          const meta = document.createElement('meta')
          meta.name = 'google-adsense-account'
          meta.content = config.advertising.clientId
          document.head.append(meta)
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [active])

  return publicConfig
}

export const openPrivacyChoices = () => {
  window.googlefc = window.googlefc || {}
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || []
  window.googlefc.callbackQueue.push(() => window.googlefc.showRevocationMessage?.())
}
