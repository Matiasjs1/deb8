import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/LocaleProvider.jsx'
import './Settings.css'

export default function Settings() {
  const { lang, setLang, t } = useI18n()
  const navigate = useNavigate()

  return (
    <div className="settings-wrap">
      <div className="settings-header">
        <button className="icon-btn back-btn" onClick={() => navigate(-1)} aria-label="Volver" title="Volver">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 17l-5-5 5-5"/>
            <path d="M4 12h16"/>
          </svg>
        </button>
        <h2 className="settings-title">{t('settings.title')}</h2>
      </div>

      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-label">{t('settings.language')}</div>
          <div className="lang-selector">
            <label className={`pill ${lang === 'es' ? 'active' : ''}`}>
              <input type="radio" name="lang" value="es" checked={lang === 'es'} onChange={() => setLang('es')} />
              <span>🇪🇸 {t('settings.spanish')}</span>
            </label>
            <label className={`pill ${lang === 'en' ? 'active' : ''}`}>
              <input type="radio" name="lang" value="en" checked={lang === 'en'} onChange={() => setLang('en')} />
              <span>🇺🇸 {t('settings.english')}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
