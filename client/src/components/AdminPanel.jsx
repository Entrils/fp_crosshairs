import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { colorOptions, fetchJson, responsiveImageProps } from '../lib/api'
import { Icon, SiteHeader, Toast, TypeSelect } from './UI'

function AdminPanel({ items, stats, authenticated, setAuthenticated, onCreated, onUpdated, onDeleted }) {
  const { i18n, t } = useTranslation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState('')
  const [activeTab, setActiveTab] = useState('add')
  const [editingItem, setEditingItem] = useState(null)
  const [manageQuery, setManageQuery] = useState('')
  const [manageSort, setManageSort] = useState('updated')
  const [deletingId, setDeletingId] = useState('')

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
      setPassword('')
      setAuthenticated(true)
    } catch {
      setError(t('errors.network'))
    } finally {
      setLoading(false)
    }
  }

  const submitForm = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const editing = Boolean(editingItem)
    setLoading(true)
    setError('')
    try {
      const response = await fetch(editing ? `/api/crosshairs/${editingItem.id}` : '/api/crosshairs', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'X-Admin-Request': '1' },
        body: new FormData(form),
      })
      const result = await response.json()
      if (!response.ok) return setError(result.code ? t(`errors.${result.code}`) : result.error)
      form.reset()
      setPreview('')
      if (editing) {
        onUpdated(result)
        setEditingItem(null)
        setActiveTab('manage')
      } else {
        onCreated(result)
      }
    } catch {
      setError(t('errors.network'))
    } finally {
      setLoading(false)
    }
  }

  const openTab = (tab) => {
    setError('')
    setPreview('')
    setEditingItem(null)
    setActiveTab(tab)
  }

  const openEditor = (item) => {
    setError('')
    setPreview('')
    setEditingItem(item)
    setActiveTab('edit')
  }

  const remove = async (item) => {
    if (!window.confirm(t('admin.deleteConfirm', { title: item.title }))) return
    setDeletingId(item.id)
    setError('')
    try {
      const response = await fetch(`/api/crosshairs/${item.id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Request': '1' },
      })
      if (response.ok) onDeleted(item.id)
      else {
        const result = await response.json().catch(() => null)
        setError(result?.code ? t(`errors.${result.code}`) : t('errors.generic'))
      }
    } catch {
      setError(t('errors.network'))
    } finally {
      setDeletingId('')
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', headers: { 'X-Admin-Request': '1' } })
      setAuthenticated(false)
      setActiveTab('add')
    } catch {
      setError(t('errors.network'))
    }
  }

  const visibleItems = useMemo(() => {
    const query = manageQuery.trim().toLowerCase()
    return items
      .filter((item) => !query
        || item.title.toLowerCase().includes(query)
        || item.tags.some((tag) => tag.toLowerCase().includes(query)))
      .sort((first, second) => {
        if (manageSort === 'copies') return second.copies - first.copies
        if (manageSort === 'name') return first.title.localeCompare(second.title, i18n.language)
        return new Date(second.updatedAt) - new Date(first.updatedAt)
      })
  }, [i18n.language, items, manageQuery, manageSort])

  const dailyMax = Math.max(1, ...(stats.daily || []).map(({ copies }) => copies))

  return (
    <div className="admin-page">
      <section className="admin-panel">
        <a className="icon-button modal-close" href="/" aria-label={t('common.close')}><Icon name="close" /></a>
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
            <div className="admin-overview">
              <div><span>{t('admin.total')}</span><strong>{stats.total}</strong></div>
              <div><span>{t('admin.published')}</span><strong>{stats.published}</strong></div>
              <div><span>{t('admin.drafts')}</span><strong>{stats.drafts}</strong></div>
              <div><span>{t('admin.totalCopies')}</span><strong>{stats.copies}</strong></div>
              <div className="admin-chart" aria-label={t('admin.last14Days')}>
                <span>{t('admin.last14Days')}</span>
                <div>
                  {(stats.daily || []).map((entry) => (
                    <i
                      key={entry.day}
                      style={{ '--bar-height': `${Math.max(8, (entry.copies / dailyMax) * 100)}%` }}
                      title={`${entry.day}: ${entry.copies}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {activeTab === 'add' || (activeTab === 'edit' && editingItem) ? (
              <form className="upload-form" key={editingItem?.id || 'new-crosshair'} onSubmit={submitForm}>
                <div className="form-grid">
                  <label>{t('admin.name')}<input name="title" defaultValue={editingItem?.title || ''} placeholder={t('admin.namePlaceholder')} maxLength="80" required /></label>
                  <label>{t('admin.tags')}<input name="tags" defaultValue={editingItem?.tags.join(', ') || ''} placeholder={t('admin.tagsPlaceholder')} /></label>
                </div>
                <div className="form-grid">
                  <label>
                    {t('admin.color')}
                    <select name="color" defaultValue={editingItem?.color || ''} required>
                      <option value="" disabled>{t('admin.selectColor')}</option>
                      {colorOptions.map((color) => <option value={color} key={color}>{t(`options.colors.${color}`)}</option>)}
                    </select>
                  </label>
                  <TypeSelect
                    label={t('admin.type')}
                    name="type"
                    defaultValue={editingItem?.type || ''}
                  />
                </div>
                <div className="form-grid">
                  <label>
                    {t('admin.status')}
                    <select name="status" defaultValue={editingItem?.status || 'published'}>
                      <option value="published">{t('admin.statusPublished')}</option>
                      <option value="draft">{t('admin.statusDraft')}</option>
                    </select>
                  </label>
                  <label className="checkbox-field">
                    <input name="featured" type="checkbox" value="true" defaultChecked={editingItem?.featured || false} />
                    <span>{t('admin.featured')}</span>
                  </label>
                </div>
                <label>{t('admin.code')}<textarea name="code" defaultValue={editingItem?.code || ''} placeholder={t('admin.codePlaceholder')} rows="4" required /></label>
                <label>{t('admin.description')}<textarea name="description" defaultValue={editingItem?.description || ''} placeholder={t('admin.descriptionPlaceholder')} rows="2" maxLength="300" /></label>
                <label className={`dropzone ${preview || editingItem?.image ? 'dropzone--ready' : ''}`}>
                  {preview || editingItem?.image
                    ? <><img {...(preview ? { src: preview } : responsiveImageProps(editingItem, 'card'))} alt="" /><span className="replace-hint">{t('admin.replace')}</span></>
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
                <div className="manage-toolbar">
                  <label>
                    <Icon name="search" size={17} />
                    <input value={manageQuery} onChange={(event) => setManageQuery(event.target.value)} placeholder={t('admin.search')} aria-label={t('admin.search')} />
                  </label>
                  <select value={manageSort} onChange={(event) => setManageSort(event.target.value)} aria-label={t('admin.sort')}>
                    <option value="updated">{t('admin.sortUpdated')}</option>
                    <option value="copies">{t('admin.sortCopies')}</option>
                    <option value="name">{t('admin.sortName')}</option>
                  </select>
                </div>
                {error && <div className="form-error">{error}</div>}
                {visibleItems.map((item) => (
                  <div className="manage-item" key={item.id}>
                    <img {...responsiveImageProps(item, 'thumbnail', '76px')} alt="" loading="lazy" decoding="async" />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.tags.map((tag) => `#${tag}`).join(' ')}</span>
                      <small>
                        {item.status === 'draft' ? t('admin.statusDraft') : t('admin.statusPublished')}
                        {item.featured ? ` · ${t('admin.featuredShort')}` : ''}
                        {` · ${item.copies} ${t('admin.copiesShort')}`}
                      </small>
                    </div>
                    <div className="manage-actions">
                      <button onClick={() => openEditor(item)} aria-label={t('admin.edit', { title: item.title })}><Icon name="edit" size={18} /></button>
                      <button disabled={deletingId === item.id} onClick={() => remove(item)} aria-label={t('admin.delete', { title: item.title })}><Icon name="trash" size={18} /></button>
                    </div>
                  </div>
                ))}
                {!visibleItems.length && <p className="manage-empty">{t('admin.noMatches')}</p>}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default function AdminPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [toast, setToast] = useState('')
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, copies: 0, daily: [] })

  useEffect(() => {
    document.title = 'Admin — Fragpunk Crosshairs'
    fetchJson('/api/admin/session')
      .then((session) => setAuthenticated(session.authenticated))
      .finally(() => setCheckingSession(false))
  }, [])

  useEffect(() => {
    if (!authenticated) {
      setItems([])
      return
    }
    Promise.all([
      fetchJson('/api/admin/crosshairs'),
      fetchJson('/api/admin/stats'),
    ]).then(([crosshairs, result]) => {
      setItems(crosshairs)
      setStats(result)
    }).catch(() => {
      setItems([])
      setStats({ total: 0, published: 0, drafts: 0, copies: 0, daily: [] })
    })
  }, [authenticated])

  const refreshStats = () => {
    fetchJson('/api/admin/stats').then(setStats).catch(() => {})
  }

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  return (
    <>
      <SiteHeader admin />
      {!checkingSession && (
        <AdminPanel
          items={items}
          stats={stats}
          authenticated={authenticated}
          setAuthenticated={setAuthenticated}
          onCreated={(item) => { setItems((current) => [item, ...current]); refreshStats(); notify(t('toast.published')) }}
          onUpdated={(item) => { setItems((current) => current.map((entry) => entry.id === item.id ? item : entry)); refreshStats(); notify(t('toast.updated')) }}
          onDeleted={(id) => { setItems((current) => current.filter((item) => item.id !== id)); refreshStats(); notify(t('toast.deleted')) }}
        />
      )}
      <Toast message={toast} />
    </>
  )
}
