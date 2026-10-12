import { useContext } from 'react';
import { I18nContext, type I18nContextValue } from './context';

/** 使用 i18n 上下文 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n 必须在 I18nProvider 内使用');
  return ctx;
}

/** 快捷翻译 hook */
export function useT() {
  return useI18n().t;
}
