import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { translations } from './translations.js'

const LocaleContext = createContext({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
})

function get(obj, path) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj)
}

export function LocaleProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'es')

  useEffect(() => {
    localStorage.setItem('lang', lang)
  }, [lang])

  const t = useMemo(() => {
    const dict = translations[lang] || translations.es
    return (key) => get(dict, key) ?? key
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t])

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useI18n() {
  return useContext(LocaleContext)
}
