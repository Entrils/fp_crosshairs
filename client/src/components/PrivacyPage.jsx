import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SiteHeader } from './UI'

export default function PrivacyPage({ contactEmail }) {
  const { t } = useTranslation()
  useEffect(() => {
    document.title = `${t('privacy.title')} — Fragpunk Crosshairs`
  }, [t])
  return (
    <>
      <SiteHeader />
      <main className="privacy-page">
        <a className="back-link" href="/">← {t('privacy.back')}</a>
        <h1>{t('privacy.title')}</h1>
        <p className="privacy-page__updated">{t('privacy.updated')}</p>
        <p>{t('privacy.intro')}</p>

        <section>
          <h2>{t('privacy.localTitle')}</h2>
          <p>{t('privacy.localText')}</p>
        </section>
        <section>
          <h2>{t('privacy.adsTitle')}</h2>
          <p>{t('privacy.adsText')}</p>
          <p>
            {t('privacy.adsChoices')}{' '}
            <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer">
              {t('privacy.googleSettings')}
            </a>
          </p>
        </section>
        <section>
          <h2>{t('privacy.retentionTitle')}</h2>
          <p>{t('privacy.retentionText')}</p>
        </section>
        {contactEmail && (
          <section>
            <h2>{t('privacy.contactTitle')}</h2>
            <p><a href={`mailto:${contactEmail}`}>{contactEmail}</a></p>
          </section>
        )}
      </main>
    </>
  )
}
