import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from './translations';

interface I18nValue { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey, values?: Record<string, string | number>) => string }
const I18nContext = createContext<I18nValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('forest-language') as Language) || 'ru');
  const value = useMemo<I18nValue>(() => ({ language, setLanguage: (next) => { localStorage.setItem('forest-language', next); setLanguageState(next); }, t: (key, values) => {
    let text = translations[language][key];
    Object.entries(values ?? {}).forEach(([name, replacement]) => { text = text.replace(`{${name}}`, String(replacement)); });
    return text;
  } }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
