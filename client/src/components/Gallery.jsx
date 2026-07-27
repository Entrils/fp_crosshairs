import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { colorOptions, fetchGallery, formatCopies, responsiveImageProps, typeOptions } from '../lib/api'
import { rememberRecent, toggleFavorite, useStoredIds } from '../lib/library'
import CrosshairModal from './CrosshairModal'
import { ColorWheelSelect, CrosshairAttributes, Icon, TypeSelect } from './UI'

const MotionEffects = lazy(() => import('../MotionEffects'))

function CrosshairCard({ item, onOpen, onCopy, favorite, onToggleFavorite }) {
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

  const favoriteItem = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onToggleFavorite(item.id)
  }

  return (
    <article className="card">
      <div className="card__image-wrap">
        <img
          className="card__image"
          {...responsiveImageProps(item, 'card', '(max-width: 650px) calc(100vw - 44px), (max-width: 950px) 50vw, 33vw')}
          alt={`${t('gallery.game')} — ${item.title}`}
          loading="lazy"
          decoding="async"
        />
        <span className="card__badge"><span className="live-dot" />{t('gallery.game')}</span>
        <button
          className={`favorite-button ${favorite ? 'favorite-button--active' : ''}`}
          onClick={favoriteItem}
          aria-label={favorite ? t('common.removeFavorite') : t('common.addFavorite')}
          aria-pressed={favorite}
        >
          <Icon name="heart" size={17} />
        </button>
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

const readGalleryFilters = () => {
  const parameters = new URLSearchParams(window.location.search)
  const parsedPage = Number.parseInt(parameters.get('page') || '1', 10)
  const color = parameters.get('color') || 'all'
  const type = parameters.get('type') || 'all'
  const sort = parameters.get('sort') === 'new' ? 'new' : 'popular'
  return {
    query: (parameters.get('q') || '').slice(0, 100),
    tag: (parameters.get('tag') || 'all').slice(0, 30),
    color: colorOptions.includes(color) ? color : 'all',
    type: typeOptions.includes(type) || type === 'none' ? type : 'all',
    sort,
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  }
}

export default function Gallery({ onCopy, onShare, onStatsChange }) {
  const { t } = useTranslation()
  const initialFilters = useMemo(readGalleryFilters, [])
  const [items, setItems] = useState([])
  const [query, setQuery] = useState(initialFilters.query)
  const [debouncedQuery, setDebouncedQuery] = useState(initialFilters.query)
  const [selectedTag, setSelectedTag] = useState(initialFilters.tag)
  const [selectedColor, setSelectedColor] = useState(initialFilters.color)
  const [selectedType, setSelectedType] = useState(initialFilters.type)
  const [sort, setSort] = useState(initialFilters.sort)
  const [page, setPage] = useState(initialFilters.page)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [tags, setTags] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const favoriteIds = useStoredIds('favorites')
  const searchRef = useRef(null)
  const historyModeRef = useRef('replace')
  const syncingFromHistoryRef = useRef(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  useEffect(() => {
    const restoreFilters = () => {
      const filters = readGalleryFilters()
      syncingFromHistoryRef.current = true
      setQuery(filters.query)
      setDebouncedQuery(filters.query)
      setSelectedTag(filters.tag)
      setSelectedColor(filters.color)
      setSelectedType(filters.type)
      setSort(filters.sort)
      setPage(filters.page)
    }
    window.addEventListener('popstate', restoreFilters)
    return () => window.removeEventListener('popstate', restoreFilters)
  }, [])

  useEffect(() => {
    if (syncingFromHistoryRef.current) {
      syncingFromHistoryRef.current = false
      return
    }
    const parameters = new URLSearchParams()
    if (debouncedQuery) parameters.set('q', debouncedQuery)
    if (selectedTag !== 'all') parameters.set('tag', selectedTag)
    if (selectedColor !== 'all') parameters.set('color', selectedColor)
    if (selectedType !== 'all') parameters.set('type', selectedType)
    if (sort !== 'popular') parameters.set('sort', sort)
    if (page > 1) parameters.set('page', String(page))
    const search = parameters.toString()
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
    window.history[`${historyModeRef.current}State`](null, '', nextUrl)
    historyModeRef.current = 'replace'
  }, [debouncedQuery, page, selectedColor, selectedTag, selectedType, sort])

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
        setHasLoaded(true)
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
  const tagValues = useMemo(() => {
    const available = tags.map(({ tag }) => tag)
    if (selectedTag !== 'all' && !available.includes(selectedTag)) available.unshift(selectedTag)
    return ['all', ...available]
  }, [selectedTag, tags])
  const changeFilter = (setter) => (eventOrValue) => {
    const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue
    historyModeRef.current = 'push'
    setter(value)
    setPage(1)
  }
  const changePage = (nextPage) => {
    historyModeRef.current = 'push'
    setPage(nextPage)
    document.querySelector('#gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const copy = async (item) => {
    const result = await onCopy(item)
    if (!result) return false
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, copies: result.copies } : entry))
    if (result.counted) onStatsChange((current) => ({ ...current, copies: current.copies + 1 }))
    return true
  }

  const reset = () => {
    historyModeRef.current = 'push'
    setQuery('')
    setDebouncedQuery('')
    setSelectedTag('all')
    setSelectedColor('all')
    setSelectedType('all')
    setSort('popular')
    setPage(1)
  }
  const openItem = (item) => {
    rememberRecent(item.id)
    setSelected(item)
  }

  return (
    <>
      <Suspense fallback={null}><MotionEffects galleryReady={!loading} cardCount={items.length} /></Suspense>
      <section className="gallery-section" id="gallery" aria-busy={loading}>
        <div className="section-heading">
          <div><h2>{t('gallery.title')}</h2><p>{t('gallery.subtitle')}</p></div>
          <div className="result-count"><strong>{String(total).padStart(2, '0')}</strong><span>{t('gallery.results')}</span></div>
        </div>

        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={19} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                historyModeRef.current = 'replace'
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder={t('gallery.search')}
              aria-label={t('gallery.search')}
            />
            <kbd>Ctrl / ⌘ K</kbd>
          </label>
          <div className="sort-switch" role="group" aria-label={`${t('gallery.popular')} / ${t('gallery.new')}`}>
            <button aria-pressed={sort === 'popular'} className={sort === 'popular' ? 'active' : ''} onClick={() => changeFilter(setSort)('popular')}>{t('gallery.popular')}</button>
            <button aria-pressed={sort === 'new'} className={sort === 'new' ? 'active' : ''} onClick={() => changeFilter(setSort)('new')}>{t('gallery.new')}</button>
          </div>
        </div>
        <div className="attribute-filters">
          <ColorWheelSelect
            label={t('filters.color')}
            value={selectedColor}
            onValueChange={changeFilter(setSelectedColor)}
          />
          <TypeSelect
            label={t('filters.type')}
            value={selectedType}
            onValueChange={changeFilter(setSelectedType)}
            includeAll
          />
        </div>
        <div className="tag-filter">
          {tagValues.map((tag) => (
            <button aria-pressed={selectedTag === tag} key={tag} onClick={() => changeFilter(setSelectedTag)(tag)} className={selectedTag === tag ? 'active' : ''}>
              {tag === 'all' ? t('gallery.all') : `# ${t(`tags.${tag}`, { defaultValue: tag })}`}
            </button>
          ))}
        </div>

        {loading && hasLoaded && <div className="gallery-refresh" aria-hidden="true"><i /></div>}
        {loading && !hasLoaded ? (
          <div className="cards-grid">{[1, 2, 3, 4, 5, 6].map((key) => <div className="card skeleton" key={key} />)}</div>
        ) : loadError ? (
          <div className="empty-state"><Icon name="crosshair" size={42} /><h3>{t('errors.network')}</h3><p>{t('errors.generic')}</p><button onClick={() => window.location.reload()}>{t('gallery.retry')}</button></div>
        ) : items.length ? (
          <>
            <div className={`cards-grid ${loading ? 'cards-grid--refreshing' : ''}`}>{items.map((item) => (
              <CrosshairCard
                item={item}
                key={item.id}
                onOpen={openItem}
                onCopy={copy}
                favorite={favoriteIds.includes(item.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}</div>
            {totalPages > 1 && (
              <nav className="pagination" aria-label={t('gallery.pagination')}>
                <button disabled={page === 1} onClick={() => changePage(page - 1)} aria-label={t('gallery.previous')}>←</button>
                {pages.map((value, index) => (
                  <span key={value}>
                    {index > 0 && value - pages[index - 1] > 1 && <i>…</i>}
                    <button className={value === page ? 'active' : ''} onClick={() => changePage(value)} aria-current={value === page ? 'page' : undefined}>{value}</button>
                  </span>
                ))}
                <button disabled={page === totalPages} onClick={() => changePage(page + 1)} aria-label={t('gallery.next')}>→</button>
              </nav>
            )}
          </>
        ) : (
          <div className="empty-state"><Icon name="crosshair" size={42} /><h3>{t('gallery.emptyTitle')}</h3><p>{t('gallery.emptyText')}</p><button onClick={reset}>{t('gallery.reset')}</button></div>
        )}
      </section>
      {selected && (
        <CrosshairModal
          item={selected}
          onClose={() => setSelected(null)}
          onCopy={copy}
          onShare={onShare}
          favorite={favoriteIds.includes(selected.id)}
          onToggleFavorite={() => toggleFavorite(selected.id)}
        />
      )}
    </>
  )
}
