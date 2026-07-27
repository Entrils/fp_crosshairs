import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { languages } from '../i18n'
import { colorOptions, typeOptions } from '../lib/api'

export const Icon = ({ name, size = 20 }) => {
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
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></>,
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

export const CrosshairTypeIcon = ({ type, size = 26 }) => {
  const shape = {
    all: <><circle cx="12" cy="12" r="7" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></>,
    circle: <><circle cx="12" cy="12" r="5.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    dot: <circle cx="12" cy="12" r="3.25" fill="currentColor" stroke="none" />,
    square: <><rect x="6.5" y="6.5" width="11" height="11" /><circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none" /></>,
    cross: <><path d="M12 3v6m0 6v6M3 12h6m6 0h6" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>,
    none: <><circle cx="12" cy="12" r="7" opacity=".35" /><path d="M6.5 17.5l11-11" /></>,
  }
  return (
    <svg className="type-icon" aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      {shape[type] || shape.none}
    </svg>
  )
}

export function TypeSelect({
  label,
  name,
  value,
  defaultValue = '',
  onValueChange,
  includeAll = false,
}) {
  const { t } = useTranslation()
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const optionRefs = useRef([])
  const controlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const selectedValue = controlled ? value : internalValue
  const options = includeAll
    ? ['all', ...typeOptions, 'none']
    : ['', ...typeOptions]
  const optionLabel = (option) => {
    if (option === 'all') return t('filters.allTypes')
    if (option === 'none' || option === '') return includeAll ? t('filters.noType') : t('admin.noType')
    return t(`options.types.${option}`)
  }

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const closeWithKeyboard = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', closeOutside)
    window.addEventListener('keydown', closeWithKeyboard)
    return () => {
      window.removeEventListener('pointerdown', closeOutside)
      window.removeEventListener('keydown', closeWithKeyboard)
    }
  }, [open])

  const choose = (option) => {
    if (!controlled) setInternalValue(option)
    onValueChange?.(option)
    setOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const openFromKeyboard = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    setOpen(true)
    const selectedIndex = Math.max(0, options.indexOf(selectedValue))
    const targetIndex = event.key === 'ArrowUp' ? options.length - 1 : selectedIndex
    window.requestAnimationFrame(() => optionRefs.current[targetIndex]?.focus())
  }

  const navigateOptions = (event, index) => {
    let targetIndex
    if (event.key === 'ArrowDown') targetIndex = (index + 1) % options.length
    else if (event.key === 'ArrowUp') targetIndex = (index - 1 + options.length) % options.length
    else if (event.key === 'Home') targetIndex = 0
    else if (event.key === 'End') targetIndex = options.length - 1
    else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    } else return
    event.preventDefault()
    optionRefs.current[targetIndex]?.focus()
  }

  const visualType = selectedValue === '' ? 'none' : selectedValue
  return (
    <div className="type-select-field">
      <span>{label}</span>
      <div className={`type-select ${open ? 'open' : ''}`} ref={rootRef}>
        {name && <input type="hidden" name={name} value={selectedValue} />}
        <button
          ref={triggerRef}
          type="button"
          className="type-select__button"
          aria-label={`${label}: ${optionLabel(selectedValue)}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={openFromKeyboard}
        >
          <CrosshairTypeIcon type={visualType} />
          <strong>{optionLabel(selectedValue)}</strong>
          <Icon name="chevron" size={14} />
        </button>
        {open && (
          <div className="type-select__menu" role="listbox" aria-label={label}>
            {options.map((option, index) => (
              <button
                ref={(element) => { optionRefs.current[index] = element }}
                type="button"
                role="option"
                aria-selected={option === selectedValue}
                className={option === selectedValue ? 'active' : ''}
                key={option || 'empty'}
                onClick={() => choose(option)}
                onKeyDown={(event) => navigateOptions(event, index)}
              >
                <CrosshairTypeIcon type={option === '' ? 'none' : option} />
                <span>{optionLabel(option)}</span>
                {option === selectedValue && <Icon name="check" size={15} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const hueColors = [
  { name: 'red', angle: 0 },
  { name: 'orange', angle: 30 },
  { name: 'yellow', angle: 60 },
  { name: 'green', angle: 120 },
  { name: 'blue', angle: 215 },
  { name: 'indigo', angle: 245 },
  { name: 'violet', angle: 280 },
]

const circularDistance = (first, second) => {
  const distance = Math.abs(first - second)
  return Math.min(distance, 360 - distance)
}

export function ColorWheelSelect({ label, value = 'all', onValueChange }) {
  const { t } = useTranslation()
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const selectedHue = hueColors.find(({ name }) => name === value)
  const optionLabel = (option) => option === 'all'
    ? t('filters.allColors')
    : t(`options.colors.${option}`)

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const closeWithKeyboard = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', closeOutside)
    window.addEventListener('keydown', closeWithKeyboard)
    return () => {
      window.removeEventListener('pointerdown', closeOutside)
      window.removeEventListener('keydown', closeWithKeyboard)
    }
  }, [open])

  const choose = (option, close = true) => {
    onValueChange?.(option)
    if (close) {
      setOpen(false)
      window.requestAnimationFrame(() => triggerRef.current?.focus())
    }
  }

  const chooseFromWheel = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - bounds.left - (bounds.width / 2)
    const y = event.clientY - bounds.top - (bounds.height / 2)
    const angle = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360
    const closest = hueColors.reduce((nearest, option) => (
      circularDistance(angle, option.angle) < circularDistance(angle, nearest.angle)
        ? option
        : nearest
    ))
    choose(closest.name)
  }

  const chooseWithKeyboard = (event) => {
    const currentIndex = Math.max(0, hueColors.findIndex(({ name }) => name === value))
    let nextIndex
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nextIndex = (currentIndex + 1) % hueColors.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nextIndex = (currentIndex - 1 + hueColors.length) % hueColors.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = hueColors.length - 1
    else return
    event.preventDefault()
    choose(hueColors[nextIndex].name, false)
  }

  const wheelStyle = selectedHue
    ? {
        '--picker-x': `${50 + Math.cos(selectedHue.angle * Math.PI / 180) * 40}%`,
        '--picker-y': `${50 + Math.sin(selectedHue.angle * Math.PI / 180) * 40}%`,
      }
    : undefined

  return (
    <div className="color-wheel-field">
      <span>{label}</span>
      <div className={`color-wheel-select ${open ? 'open' : ''}`} ref={rootRef}>
        <button
          ref={triggerRef}
          type="button"
          className="color-wheel-select__button"
          aria-label={`${label}: ${optionLabel(value)}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <i className={value === 'all' ? 'color-swatch color-swatch--spectrum' : `color-swatch color-swatch--${value}`} />
          <strong>{optionLabel(value)}</strong>
          <Icon name="chevron" size={14} />
        </button>
        {open && (
          <div className="color-wheel-select__menu" role="dialog" aria-label={label}>
            <div
              className="color-wheel__disc"
              style={wheelStyle}
              onClick={chooseFromWheel}
              onKeyDown={chooseWithKeyboard}
              role="slider"
              tabIndex="0"
              aria-label={label}
              aria-valuemin="0"
              aria-valuemax={hueColors.length - 1}
              aria-valuenow={Math.max(0, hueColors.findIndex(({ name }) => name === value))}
              aria-valuetext={optionLabel(selectedHue?.name || 'red')}
              aria-orientation="horizontal"
            >
              {selectedHue && <i className="color-wheel__picker" />}
            </div>
            <div className="color-wheel__hues">
              {hueColors.map(({ name }) => (
                <button
                  type="button"
                  className={value === name ? 'active' : ''}
                  aria-label={optionLabel(name)}
                  aria-pressed={value === name}
                  key={name}
                  onClick={() => choose(name)}
                >
                  <i className={`color-swatch color-swatch--${name}`} />
                </button>
              ))}
            </div>
            <div className="color-wheel__neutrals">
              {['all', ...colorOptions.filter((color) => color === 'white' || color === 'black')].map((option) => (
                <button
                  type="button"
                  className={value === option ? 'active' : ''}
                  key={option}
                  onClick={() => choose(option)}
                >
                  <i className={option === 'all' ? 'color-swatch color-swatch--spectrum' : `color-swatch color-swatch--${option}`} />
                  <span>{optionLabel(option)}</span>
                  {value === option && <Icon name="check" size={14} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const optionRefs = useRef([])
  const current = languages.find(({ code }) => code === i18n.resolvedLanguage) || languages[0]

  useEffect(() => {
    if (!open) return undefined
    const close = () => setOpen(false)
    const closeWithKeyboard = (event) => event.key === 'Escape' && close()
    window.addEventListener('click', close)
    window.addEventListener('keydown', closeWithKeyboard)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', closeWithKeyboard)
    }
  }, [open])

  const chooseLanguage = (code) => {
    i18n.changeLanguage(code)
    setOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const openFromKeyboard = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    setOpen(true)
    const currentIndex = Math.max(0, languages.findIndex(({ code }) => code === current.code))
    const targetIndex = event.key === 'ArrowUp' ? languages.length - 1 : currentIndex
    window.requestAnimationFrame(() => optionRefs.current[targetIndex]?.focus())
  }

  const navigateLanguages = (event, index) => {
    let targetIndex
    if (event.key === 'ArrowDown') targetIndex = (index + 1) % languages.length
    else if (event.key === 'ArrowUp') targetIndex = (index - 1 + languages.length) % languages.length
    else if (event.key === 'Home') targetIndex = 0
    else if (event.key === 'End') targetIndex = languages.length - 1
    else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    } else return
    event.preventDefault()
    optionRefs.current[targetIndex]?.focus()
  }

  return (
    <div className="language-switcher" onClick={(event) => event.stopPropagation()}>
      <button ref={triggerRef} className={`language-button ${open ? 'active' : ''}`} onClick={() => setOpen((value) => !value)} onKeyDown={openFromKeyboard} aria-label={t('language.label')} aria-expanded={open}>
        <span className="language-flag">{current.flag}</span>
        <span className="language-code">{current.short}</span>
        <Icon name="chevron" size={14} />
      </button>
      {open && (
        <div className="language-menu" role="menu">
          <span>{t('language.label')}</span>
          {languages.map((language, index) => (
            <button
              ref={(element) => { optionRefs.current[index] = element }}
              className={language.code === current.code ? 'active' : ''}
              key={language.code}
              role="menuitemradio"
              aria-checked={language.code === current.code}
              onClick={() => chooseLanguage(language.code)}
              onKeyDown={(event) => navigateLanguages(event, index)}
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

export const Brand = () => (
  <a className="brand" href="/" aria-label="Fragpunk Crosshairs">
    <span className="brand__mark"><i /><i /><i /></span>
    <span>Fragpunk Crosshairs</span>
  </a>
)

export function SiteHeader({ admin = false }) {
  const { t } = useTranslation()
  return (
    <header className={`site-header ${admin ? 'admin-site-header' : ''}`}>
      <Brand />
      {!admin && <nav><a href="/#gallery" className="active">{t('nav.crosshairs')}</a><a href="/#guide">{t('nav.install')}</a></nav>}
      <div className="header-actions"><LanguageSwitcher /></div>
    </header>
  )
}

export const Toast = ({ message }) => (
  <div className={`toast ${message ? 'toast--visible' : ''}`} role="status" aria-live="polite">
    <Icon name="check" size={17} />{message}
  </div>
)

export function CrosshairAttributes({ item }) {
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
      {item.type && <span><CrosshairTypeIcon type={item.type} size={15} />{t(`options.types.${item.type}`, { defaultValue: item.type })}</span>}
    </div>
  )
}
