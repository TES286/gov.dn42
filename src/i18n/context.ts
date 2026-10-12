import { createContext } from 'react';
import { en } from './locales/en';
import { zh } from './locales/zh';

/** 支持的语言 */
export type Locale = 'zh' | 'en';

/** 翻译消息字典 */
const messages: Record<Locale, typeof zh> = { zh, en };

/** 浏览器语言推断 */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'zh';
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('zh')) return 'zh';
  return 'en';
}

export const STORAGE_KEY = 'gov-dn42-lang';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** 翻译函数：支持点号分隔的嵌套键，如 t('nav.home') */
  t: (key: string) => string;
  /** 取本地化文本：对 { zh, en } 结构的对象按当前语言取值 */
  pick: <T>(item: { zh: T; en: T }) => T;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

/** 消息字典（导出以便 hook 使用） */
export { messages };
