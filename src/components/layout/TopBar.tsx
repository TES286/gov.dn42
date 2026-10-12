import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';

/** 顶部功能条：站点标识 + 快捷链接 + 语言切换 */
export function TopBar() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className='topbar'>
      <div className='container topbar__inner'>
        <span className='topbar__note'>{t('topbar.note')}</span>
        <div className='topbar__links'>
          <Link to='/legal'>{t('topbar.legal')}</Link>
          <Link to='/contact'>{t('topbar.contact')}</Link>
          <button
            type='button'
            className='topbar__lang topbar__lang--link'
            onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
            aria-label={locale === 'zh' ? t('common.langSwitch') : t('common.langName')}
            lang={locale === 'zh' ? 'en' : 'zh-CN'}
          >
            {t('common.langSwitch')}
          </button>
        </div>
      </div>
    </div>
  );
}
