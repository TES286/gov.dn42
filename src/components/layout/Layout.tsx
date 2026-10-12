import { Outlet, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { NoticeBar } from './NoticeBar';
import { ScrollToTop } from './ScrollToTop';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { TopBar } from './TopBar';

/** 全站布局：顶部功能条 / 站头 / 阶段横幅 / 内容 / 页脚
 *  对齐 GOV.UK Design System：phase-banner 在全站所有页面顶部展示。 */
export function Layout() {
  const { pathname } = useLocation();
  const { t } = useI18n();

  return (
    <>
      <a className='skip-link' href='#main'>
        {t('common.skipToContent')}
      </a>
      <ScrollToTop />
      <TopBar />
      {/* key 使路由切换时重置头部菜单状态 */}
      <SiteHeader key={pathname} />
      <NoticeBar />
      <main id='main'>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
