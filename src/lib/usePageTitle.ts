import { useEffect } from 'react';
import { useI18n } from '../i18n';

/** 设置各页面浏览器标签标题
 *  传入页面标题（已本地化），自动拼接站点名；
 *  不传参时仅使用站点名作为默认标题。 */
export function usePageTitle(title?: string) {
  const { t } = useI18n();
  useEffect(() => {
    const siteName = t('common.siteName');
    document.title = title ? `${title} - ${siteName}` : `${siteName}`;
  }, [title, t]);
}
