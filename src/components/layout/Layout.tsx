import { Outlet, useLocation } from 'react-router-dom';
import { NoticeBar } from './NoticeBar';
import { ScrollToTop } from './ScrollToTop';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { TopBar } from './TopBar';

/** 全站布局：顶部功能条 / 站头 / 公告条（仅首页）/ 内容 / 页脚 */
export function Layout() {
  const { pathname } = useLocation();

  return (
    <>
      <a className='skip-link' href='#main'>
        跳转到主要内容
      </a>
      <ScrollToTop />
      <TopBar />
      {/* key 使路由切换时重置头部菜单状态 */}
      <SiteHeader key={pathname} />
      {pathname === '/' && <NoticeBar />}
      <main id='main'>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
