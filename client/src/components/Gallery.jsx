import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { colorOptions, fetchGallery, formatCopies } from '../lib/api'
import CrosshairModal from './CrosshairModal'
import { CrosshairAttributes, Icon, TypeSelect } from './UI'

const MotionEffects = lazy(() => import('../MotionEffects'))

function CrosshairCard({ item, onOpen, onCopy }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copy = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    const result = await onCopy(item)
    if (result) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    }
  }

  const openPreview = (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    onOpen(item)
  }

  return (
    <article className="card">
      <div className="card__image-wrap">
        <img className="card__image" src={item.image} alt={`${t('gallery.game')} — ${item.title}`} loading="lazy" />
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
      <a className="card__open" href={`/crosshairs/${encodeURIComponent(item.id)}`} onClick={openPreview} aria-label={item.title} />
    </article>
  )
}

const pageRange = (page, totalPages) => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  return [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b)
}

export default function Gallery({ onCopy, onStatsChange }) {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedColor, setSelectedColor] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [sort, setSort] = useState('popular')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [tags, setTags] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(1)
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(false)
    fetchGallery({
      page,
      limit: 12,
      query: debouncedQuery,
      tag: selectedTag,
      color: selectedColor,
      type: selectedType,
      sort,
    }, { signal: controller.signal })
      .then((result) => {
        setItems(result.items)
        setTotal(result.total)
        setTotalPages(result.totalPages)
        setTags(result.tags || [])
        onStatsChange(result.stats || { total: result.total, copies: 0 })
        if (result.page !== page) setPage(result.page)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [debouncedQuery, onStatsChange, page, selectedColor, selectedTag, selectedType, sort])

  const pages = useMemo(() => pageRange(page, totalPages), [page, totalPages])
  const changeFilter = (setter) => (eventOrValue) => {
    const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue
    setter(value)
    setPage(1)
  }

  const copy = async (item) => {
    const result = await onCopy(item)
    if (!result) return false
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, copies: result.copies } : entry))
    if (result.counted) onStatsChange((current) => ({ ...current, copies: current.copies + 1 }))
    return true
  }

  const reset = () => {
    setQuery('')
    setDebouncedQuery('')
    setSelectedTag('all')
    setSelectedColor('all')
    setSelectedType('all')
    setPage(1)
  }

  return (
    <>
      <Suspense fallback={null}><MotionEffects galleryReady={!loading} cardCount={items.length} /></Suspense>
      <section className="gallery-section" id="gallery">
        <div className="section-heading">
          <div><span className="section-index">{t('gallery.index')}</span><h2>{t('gallery.title')}</h2><p>{t('gallery.subtitle')}</p></div>
          <div className="result-count"><strong>{String(total).padStart(2, '0')}</strong><span>{t('gallery.results')}</span></div>
        </div>

        <div className="toolbar">
          <label className="search"><Icon name="search" size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('gallery.search')} /><kbd>⌘ K</kbd></label>
          <div className="sort-switch">
            <button className={sort === 'popular' ? 'active' : ''} onClick={() => changeFilter(setSort)('popular')}>{t('gallery.popular')}</button>
            <button className={sort === 'new' ? 'active' : ''} onClick={() => changeFilter(setSort)('new')}>{t('gallery.new')}</button>
          </div>
        </div>
        <div className="attribute-filters">
          <label>
            <span>{t('filters.color')}</span>
            <select value={selectedColor} onChange={changeFilter(setSelectedColor)}>
              <option value="all">{t('filters.allColors')}</option>
              {colorOptions.map((color) => <option value={color} key={color}>{t(`options.colors.${color}`)}</option>)}
            </select>
          </label>
          <TypeSelect
            label={t('filters.type')}
            value={selectedType}
            onValueChange={changeFilter(setSelectedType)}
            includeAll
          />
        </div>
        <div className="tag-filter">
          {['all', ...tags.map(({ tag }) => tag)].map((tag) => (
            <button key={tag} onClick={() => changeFilter(setSelectedTag)(tag)} className={selectedTag === tag ? 'active' : ''}>
              {tag === 'all' ? t('gallery.all') : `# ${t(`tags.${tag}`, { defaultValue: tag })}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="cards-grid">{[1, 2, 3, 4, 5, 6].map((key) => <div className="card skeleton" key={key} />)}</div>
        ) : loadError ? (
          <div className="empty-state"><Icon name="crosshair" size={42} /><h3>{t('errors.network')}</h3><p>{t('errors.generic')}</p><button onClick={() => window.location.reload()}>{t('gallery.retry')}</button></div>
        ) : items.length ? (
          <>
            <div className="cards-grid">{items.map((item) => <CrosshairCard item={item} key={item.id} onOpen={setSelected} onCopy={copy} />)}</div>
            {totalPages > 1 && (
              <nav className="pagination" aria-label={t('gallery.pagination')}>
                <button disabled={page === 1} onClick={() => setPage((current) => current - 1)} aria-label={t('gallery.previous')}>←</button>
                {pages.map((value, index) => (
                  <span key={value}>
                    {index > 0 && value - pages[index - 1] > 1 && <i>…</i>}
                    <button className={value === page ? 'active' : ''} onClick={() => setPage(value)} aria-current={value === page ? 'page' : undefined}>{value}</button>
                  </span>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage((current) => current + 1)} aria-label={t('gallery.next')}>→</button>
              </nav>
            )}
          </>
        ) : (
          <div className="empty-state"><Icon name="crosshair" size={42} /><h3>{t('gallery.emptyTitle')}</h3><p>{t('gallery.emptyText')}</p><button onClick={reset}>{t('gallery.reset')}</button></div>
        )}
      </section>
      {selected && <CrosshairModal item={selected} onClose={() => setSelected(null)} onCopy={copy} />}
    </>
  )
}
