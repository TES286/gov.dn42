import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { detectLocale, I18nContext, messages, STORAGE_KEY, type I18nContextValue, type Locale } from './context';

/** i18n 上下文提供者：注入全站 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof localStorage === 'undefined') return detectLocale();
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    return saved ?? detectLocale();
  });

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const dict = messages[locale];
    const t = (key: string): string => {
      const parts = key.split('.');
      let val: unknown = dict;
      for (const part of parts) {
        if (val == null || typeof val !== 'object') {
          val = undefined;
          break;
        }
        val = (val as Record<string, unknown>)[part];
      }
      return typeof val === 'string' ? val : key;
    };
    const pick = <T,>(item: { zh: T; en: T }): T => item[locale] ?? item.zh;
    return { locale, setLocale, t, pick };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
