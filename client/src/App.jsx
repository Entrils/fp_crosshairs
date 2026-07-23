import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { languages } from './i18n'

const HeroScene = lazy(() => import('./HeroScene'))
const MotionEffects = lazy(() => import('./MotionEffects'))
const colorOptions = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'white', 'black']
const typeOptions = ['circle', 'dot', 'square']

const fetchJson = async (url, options) => {
  const response = await fetch(url, options)
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.error || `HTTP ${response.status}`)
  return result
}

const fetchCrosshairs = async () => {
  const result = await fetchJson('/api/crosshairs')
  if (!Array.isArray(result)) throw new Error('Invalid crosshair response')
  return result
}

const DesktopHeroScene = () => {
  const [enabled, setEnabled] = useState(() => window.matchMedia('(min-width: 651px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 651px)')
    const update = () => setEnabled(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  if (!enabled) return null
  return <Suspense fallback={null}><HeroScene /></Suspense>
}

const Icon = ({ name, size = 20 }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    upload: <><path d="M12 3v12m0-12-5 5m5-5 5 5" /><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6" /><path d="M10 11v5m4-5v5" /></>,
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5" /></>,
    crosshair: <><circle cx="12" cy="12" r="6" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = languages.find(({ code }) => code === i18n.resolvedLanguage) || languages[0]

  useEffect(() => {
    if (!open) return undefined
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])

  return (
    <div className="language-switcher" onClick={(event) => event.stopPropagation()}>
      <button className={`language-button ${open ? 'active' : ''}`} onClick={() => setOpen((value) => !value)} aria-label={t('language.label')} aria-expanded={open}>
        <span className="language-flag">{current.flag}</span>
        <span className="language-code">{current.short}</span>
        <Icon name="chevron" size={14} />
      </button>
      {open && (
        <div className="language-menu" role="menu">
          <span>{t('language.label')}</span>
          {languages.map((language) => (
            <button
              className={language.code === current.code ? 'active' : ''}
              key={language.code}
              role="menuitemradio"
              aria-checked={language.code === current.code}
              onClick={() => { i18n.changeLanguage(language.code); setOpen(false) }}
            >
              <span className="language-flag">{language.flag}</span>
              <strong>{language.label}</strong>
              <small>{language.short}</small>
              {language.code === current.code && <Icon name="check" size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const formatCopies = (value) => {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return value
}

function Toast({ message }) {
  return <div className={`toast ${message ? 'toast--visible' : ''}`}><Icon name="check" size={17} />{message}</div>
}

function CrosshairAttributes({ item }) {
  const { t } = useTranslation()
  if (!item.color && !item.type) return null
  return (
    <div className="crosshair-attributes">
      {item.color && (
        <span>
          <i className={`color-swatch color-swatch--${item.color}`} />
          {t(`options.colors.${item.color}`, { defaultValue: item.color })}
        </span>
      )}
      {item.type && <span>{t(`options.types.${item.type}`, { defaultValue: item.type })}</span>}
    </div>
  )
}

function CrosshairCard({ item, onOpen, onCopy }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copy = async (event) => {
    event.stopPropagation()
    if (await onCopy(item)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <article className="card">
      <div className="card__image-wrap">
        <img className="card__image" src={item.image} alt={`${t('gallery.game')} — ${item.title}`} />
        <span className="card__badge"><span className="live-dot" />{t('gallery.game')}</span>
        <button className={`quick-copy ${copied ? 'quick-copy--done' : ''}`} onClick={copy}>
          <Icon name={copied ? 'check' : 'copy'} size={17} />
          {copied ? t('common.copied') : t('common.copy')}
        </button>
      </div>
      <div className="card__body">
        <div className="card__title-line">
          <h3>{item.title}</h3>
          <span className="copies"><Icon name="copy" size={14} />{formatCopies(item.copies || 0)}</span>
        </div>
        <div className="tags">
          {item.tags.map((tag) => <span className="tag" key={tag}>#{t(`tags.${tag}`, { defaultValue: tag })}</span>)}
        </div>
        <CrosshairAttributes item={item} />
      </div>
      <button className="card__open" onClick={() => onOpen(item)} aria-label={item.title} />
    </article>
  )
}

function DetailModal({ item, onClose, onCopy }) {
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

  if (!item) return null
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
          <img src={item.image} alt={`${t('gallery.game')} — ${item.title}`} />
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
          <div className="how-to">
            <span>01</span>
            <p><strong>{t('detail.step')}</strong>{t('detail.instruction')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminPanel({ items, authenticated, setAuthenticated, onClose, onCreated, onUpdated, onDeleted, standalone = false }) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState('')
  const [activeTab, setActiveTab] = useState('add')
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const login = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Request': '1' },
        body: JSON.stringify({ password }),
      })
      const result = await response.json()
      if (!response.ok) return setError(result.code ? t(`errors.${result.code}`) : result.error)
      setAuthenticated(true)
    } catch {
      setError(t('errors.network'))
    } finally {
      setLoading(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/crosshairs', {
        method: 'POST',
        headers: { 'X-Admin-Request': '1' },
        body: new FormData(form),
      })
      const result = await response.json()
      if (!response.ok) return setError(result.code ? t(`errors.${result.code}`) : result.error)
      form.reset()
      setPreview('')
      onCreated(result)
    } catch {
      setError(t('errors.network'))
    } finally {
      setLoading(false)
    }
  }

  const saveEdit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/crosshairs/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'X-Admin-Request': '1' },
        body: new FormData(form),
      })
      const result = await response.json()
      if (!response.ok) return setError(result.code ? t(`errors.${result.code}`) : result.error)
      onUpdated(result)
      setPreview('')
      setEditingItem(null)
      setActiveTab('manage')
    } catch {
      setError(t('errors.network'))
    } finally {
      setLoading(false)
    }
  }

  const openEditor = (item) => {
    setError('')
    setPreview('')
    setEditingItem(item)
    setActiveTab('edit')
  }

  const openTab = (tab) => {
    setError('')
    setPreview('')
    setEditingItem(null)
    setActiveTab(tab)
  }

  const remove = async (item) => {
    if (!window.confirm(t('admin.deleteConfirm', { title: item.title }))) return
    try {
      const response = await fetch(`/api/crosshairs/${item.id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Request': '1' },
      })
      if (response.ok) onDeleted(item.id)
      else setError(t('errors.generic'))
    } catch {
      setError(t('errors.network'))
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', headers: { 'X-Admin-Request': '1' } })
      setAuthenticated(false)
    } catch {
      setError(t('errors.network'))
    }
  }

  return (
    <div className={standalone ? 'admin-page' : 'modal-backdrop admin-backdrop'} onMouseDown={standalone ? undefined : onClose}>
      <section className="admin-panel" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label={t('common.close')}><Icon name="close" /></button>
        {!authenticated ? (
          <div className="login">
            <div className="login__mark"><Icon name="lock" size={28} /></div>
            <span className="eyebrow">{t('admin.private')}</span>
            <h2>{t('admin.loginTitle')}</h2>
            <p>{t('admin.loginText')}</p>
            <form onSubmit={login}>
              <label>{t('admin.password')}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('admin.passwordPlaceholder')} autoFocus required /></label>
              {error && <div className="form-error">{error}</div>}
              <button className="primary-button" disabled={loading}>{loading ? t('admin.checking') : t('admin.login')}<Icon name="arrow" /></button>
            </form>
            <small>{t('admin.sessionNote')}</small>
          </div>
        ) : (
          <>
            <header className="admin-header">
              <div><span className="eyebrow">{t('admin.control')}</span><h2>{t('admin.title')}</h2></div>
              <button className="logout-button" onClick={logout}><Icon name="logout" size={17} />{t('admin.logout')}</button>
            </header>
            <div className="admin-tabs">
              <button className={activeTab === 'add' ? 'active' : ''} onClick={() => openTab('add')}>{t('admin.addTab')}</button>
              <button className={activeTab === 'manage' ? 'active' : ''} onClick={() => openTab('manage')}>{t('admin.allTab')} <span>{items.length}</span></button>
              {editingItem && <button className="active">{t('admin.editTab')}</button>}
            </div>
            {activeTab === 'add' || (activeTab === 'edit' && editingItem) ? (
              <form
                className="upload-form"
                key={editingItem?.id || 'new-crosshair'}
                onSubmit={editingItem ? saveEdit : submit}
              >
                <div className="form-grid">
                  <label>{t('admin.name')}<input name="title" defaultValue={editingItem?.title || ''} placeholder={t('admin.namePlaceholder')} maxLength="80" required /></label>
                  <label>{t('admin.tags')}<input name="tags" defaultValue={editingItem?.tags.join(', ') || ''} placeholder={t('admin.tagsPlaceholder')} /></label>
                </div>
                <div className="form-grid">
                  <label>
                    {t('admin.color')}
                    <select name="color" defaultValue={editingItem?.color || ''} required>
                      <option value="" disabled>{t('admin.selectColor')}</option>
                      {colorOptions.map((color) => (
                        <option value={color} key={color}>{t(`options.colors.${color}`)}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t('admin.type')}
                    <select name="type" defaultValue={editingItem?.type || ''}>
                      <option value="">{t('admin.noType')}</option>
                      {typeOptions.map((type) => (
                        <option value={type} key={type}>{t(`options.types.${type}`)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>{t('admin.code')}<textarea name="code" defaultValue={editingItem?.code || ''} placeholder={t('admin.codePlaceholder')} rows="4" required /></label>
                <label>{t('admin.description')}<textarea name="description" defaultValue={editingItem?.description || ''} placeholder={t('admin.descriptionPlaceholder')} rows="2" maxLength="300" /></label>
                <label className={`dropzone ${preview || editingItem?.image ? 'dropzone--ready' : ''}`}>
                  {preview || editingItem?.image
                    ? <><img src={preview || editingItem.image} alt="" /><span className="replace-hint">{t('admin.replace')}</span></>
                    : <><Icon name="image" size={30} /><strong>{t('admin.uploadTitle')}</strong><span>{t('admin.uploadHint')}</span></>}
                  <input name="screenshot" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
                    if (preview) URL.revokeObjectURL(preview)
                    setPreview(event.target.files[0] ? URL.createObjectURL(event.target.files[0]) : '')
                  }} required={!editingItem} />
                </label>
                {error && <div className="form-error">{error}</div>}
                <div className="form-actions">
                  {editingItem && <button type="button" className="secondary-button" onClick={() => openTab('manage')}>{t('admin.cancel')}</button>}
                  <button className="primary-button" disabled={loading}>
                    <Icon name={editingItem ? 'check' : 'upload'} />
                    {editingItem
                      ? loading ? t('admin.saving') : t('admin.saveChanges')
                      : loading ? t('admin.uploading') : t('admin.publish')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="manage-list">
                {items.map((item) => (
                  <div className="manage-item" key={item.id}>
                    <img src={item.image} alt="" />
                    <div><strong>{item.title}</strong><span>{item.tags.map((tag) => `#${tag}`).join(' ')}</span></div>
                    <div className="manage-actions">
                      <button onClick={() => openEditor(item)} aria-label={t('admin.edit', { title: item.title })}><Icon name="edit" size={18} /></button>
                      <button onClick={() => remove(item)} aria-label={t('admin.delete', { title: item.title })}><Icon name="trash" size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default function App() {
  const { t } = useTranslation()
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin'
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedColor, setSelectedColor] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [sort, setSort] = useState('popular')
  const [selected, setSelected] = useState(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchCrosshairs(),
      isAdminRoute
        ? fetchJson('/api/admin/session')
        : Promise.resolve({ authenticated: false }),
    ]).then(([crosshairs, session]) => {
      setItems(crosshairs)
      setAuthenticated(session.authenticated)
    }).catch(() => setLoadError(true)).finally(() => setLoading(false))
  }, [isAdminRoute])

  useEffect(() => {
    document.title = isAdminRoute ? `Admin — Fragpunk Crosshairs` : 'Fragpunk Crosshairs'
  }, [isAdminRoute])

  const tags = useMemo(() => {
    const counts = new Map()
    items.flatMap((item) => item.tags).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([tag]) => tag)
  }, [items])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return items
      .filter((item) => selectedTag === 'all' || item.tags.includes(selectedTag))
      .filter((item) => selectedColor === 'all' || item.color === selectedColor)
      .filter((item) => selectedType === 'all' || (selectedType === 'none' ? !item.type : item.type === selectedType))
      .filter((item) => !normalized || item.title.toLowerCase().includes(normalized) || item.tags.some((tag) =>
        tag.includes(normalized) || t(`tags.${tag}`, { defaultValue: tag }).toLowerCase().includes(normalized),
      ))
      .sort((a, b) => sort === 'new' ? new Date(b.createdAt) - new Date(a.createdAt) : (b.copies || 0) - (a.copies || 0))
  }, [items, query, selectedTag, selectedColor, selectedType, sort, t])

  const copyCode = async (item) => {
    try {
      await navigator.clipboard.writeText(item.code)
    } catch {
      setToast(t('errors.clipboard'))
      window.setTimeout(() => setToast(''), 1800)
      return false
    }
    setToast(t('toast.copied'))
    try {
      const response = await fetch(`/api/crosshairs/${item.id}/copy`, { method: 'POST' })
      if (response.ok) {
        const result = await response.json()
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, copies: result.copies } : entry))
      }
    } catch {
      // The copy itself succeeded; the counter will be refreshed on the next page load.
    }
    window.setTimeout(() => setToast(''), 1800)
    return true
  }

  const addItem = (item) => {
    setItems((current) => [item, ...current])
    setToast(t('toast.published'))
    window.setTimeout(() => setToast(''), 1800)
  }
  const updateItem = (item) => {
    setItems((current) => current.map((entry) => entry.id === item.id ? item : entry))
    setToast(t('toast.updated'))
    window.setTimeout(() => setToast(''), 1800)
  }
  const deleteItem = (id) => setItems((current) => current.filter((item) => item.id !== id))

  if (isAdminRoute) {
    return (
      <>
        <header className="site-header admin-site-header">
          <a className="brand" href="/" aria-label="Fragpunk Crosshairs">
            <span className="brand__mark"><i /><i /><i /></span>
            <span>Fragpunk Crosshairs</span>
          </a>
          <div className="header-actions"><LanguageSwitcher /></div>
        </header>
        <AdminPanel
          items={items}
          authenticated={authenticated}
          setAuthenticated={setAuthenticated}
          onClose={() => window.location.assign('/')}
          onCreated={addItem}
          onUpdated={updateItem}
          onDeleted={deleteItem}
          standalone
        />
        <Toast message={toast} />
      </>
    )
  }

  return (
    <>
      <Suspense fallback={null}><MotionEffects galleryReady={!loading} cardCount={filtered.length} /></Suspense>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Fragpunk Crosshairs">
          <span className="brand__mark"><i /><i /><i /></span>
          <span>Fragpunk Crosshairs</span>
        </a>
        <nav><a href="#gallery" className="active">{t('nav.crosshairs')}</a><a href="#guide">{t('nav.install')}</a></nav>
        <div className="header-actions">
          <LanguageSwitcher />
        </div>
      </header>

      <main>
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
              <div><strong>{items.length || '—'}</strong><span>{t('hero.crosshairs')}</span></div>
              <div><strong>{formatCopies(items.reduce((sum, item) => sum + (item.copies || 0), 0))}</strong><span>{t('hero.copies')}</span></div>
              <div><strong>100%</strong><span>{t('hero.free')}</span></div>
            </div>
          </div>
          <div className="hero__visual-meta" aria-hidden="true">
            <span>MONO / 3D SYSTEM</span>
            <i />
            <span>CALIBRATED 01</span>
          </div>
          <span className="hero__side-text">AIM / CLICK / REPEAT</span>
        </section>

        <section className="gallery-section" id="gallery">
          <div className="section-heading">
            <div><span className="section-index">{t('gallery.index')}</span><h2>{t('gallery.title')}</h2><p>{t('gallery.subtitle')}</p></div>
            <div className="result-count"><strong>{String(filtered.length).padStart(2, '0')}</strong><span>{t('gallery.results')}</span></div>
          </div>

          <div className="toolbar">
            <label className="search"><Icon name="search" size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('gallery.search')} /><kbd>⌘ K</kbd></label>
            <div className="sort-switch">
              <button className={sort === 'popular' ? 'active' : ''} onClick={() => setSort('popular')}>{t('gallery.popular')}</button>
              <button className={sort === 'new' ? 'active' : ''} onClick={() => setSort('new')}>{t('gallery.new')}</button>
            </div>
          </div>
          <div className="attribute-filters">
            <label>
              <span>{t('filters.color')}</span>
              <select value={selectedColor} onChange={(event) => setSelectedColor(event.target.value)}>
                <option value="all">{t('filters.allColors')}</option>
                {colorOptions.map((color) => (
                  <option value={color} key={color}>{t(`options.colors.${color}`)}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('filters.type')}</span>
              <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                <option value="all">{t('filters.allTypes')}</option>
                {typeOptions.map((type) => (
                  <option value={type} key={type}>{t(`options.types.${type}`)}</option>
                ))}
                <option value="none">{t('filters.noType')}</option>
              </select>
            </label>
          </div>
          <div className="tag-filter">
            {['all', ...tags].map((tag) => <button key={tag} onClick={() => setSelectedTag(tag)} className={selectedTag === tag ? 'active' : ''}>{tag === 'all' ? t('gallery.all') : `# ${t(`tags.${tag}`, { defaultValue: tag })}`}</button>)}
          </div>

          {loading ? (
            <div className="cards-grid">{[1, 2, 3, 4, 5, 6].map((key) => <div className="card skeleton" key={key} />)}</div>
          ) : loadError ? (
            <div className="empty-state"><Icon name="crosshair" size={42} /><h3>{t('errors.network')}</h3><p>{t('errors.generic')}</p><button onClick={() => window.location.reload()}>{t('gallery.retry')}</button></div>
          ) : filtered.length ? (
            <div className="cards-grid">{filtered.map((item) => <CrosshairCard item={item} key={item.id} onOpen={setSelected} onCopy={copyCode} />)}</div>
          ) : (
            <div className="empty-state"><Icon name="crosshair" size={42} /><h3>{t('gallery.emptyTitle')}</h3><p>{t('gallery.emptyText')}</p><button onClick={() => { setQuery(''); setSelectedTag('all'); setSelectedColor('all'); setSelectedType('all') }}>{t('gallery.reset')}</button></div>
          )}
        </section>

        <section className="install-section" id="guide">
          <div className="install-copy"><span className="section-index">{t('guide.index')}</span><h2>{t('guide.title1')}<br /><em>{t('guide.title2')}</em></h2><p>{t('guide.subtitle')}</p></div>
          <div className="steps">
            <div><span>01</span><Icon name="copy" /><h3>{t('guide.copyTitle')}</h3><p>{t('guide.copyText')}</p></div>
            <div><span>02</span><Icon name="crosshair" /><h3>{t('guide.settingsTitle')}</h3><p>{t('guide.settingsText')}</p></div>
            <div><span>03</span><Icon name="upload" /><h3>{t('guide.importTitle')}</h3><p>{t('guide.importText')}</p></div>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand" href="#" aria-label="Fragpunk Crosshairs"><span className="brand__mark"><i /><i /><i /></span><span>Fragpunk Crosshairs</span></a>
        <p>{t('footer.disclaimer')}</p>
        <span>© 2026 Fragpunk Crosshairs</span>
      </footer>

      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} onCopy={copyCode} />}
      <Toast message={toast} />
    </>
  )
}
