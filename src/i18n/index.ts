/** i18n 模块统一导出口
 *  - I18nProvider：组件（见 ./provider.tsx）
 *  - useI18n / useT：hooks（见 ./hooks.ts）
 *  - 类型与常量（见 ./context.ts） */
export { I18nProvider } from './provider';
export { useI18n, useT } from './hooks';
export type { Locale, I18nContextValue } from './context';
