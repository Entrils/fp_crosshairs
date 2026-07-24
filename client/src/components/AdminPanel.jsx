import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { colorOptions, fetchJson } from '../lib/api'
import { Icon, SiteHeader, Toast, TypeSelect } from './UI'

function AdminPanel({ items, authenticated, setAuthenticated, onCreated, onUpdated, onDeleted }) {
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
      setActiveTab('add')
    } catch {
      setError(t('errors.network'))
    }
  }

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

export default function AdminPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [toast, setToast] = useState('')

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
    fetchJson('/api/admin/crosshairs').then(setItems).catch(() => setItems([]))
  }, [authenticated])

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
          authenticated={authenticated}
          setAuthenticated={setAuthenticated}
          onCreated={(item) => { setItems((current) => [item, ...current]); notify(t('toast.published')) }}
          onUpdated={(item) => { setItems((current) => current.map((entry) => entry.id === item.id ? item : entry)); notify(t('toast.updated')) }}
          onDeleted={(id) => setItems((current) => current.filter((item) => item.id !== id))}
        />
      )}
      <Toast message={toast} />
    </>
  )
}
