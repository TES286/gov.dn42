import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Crest } from '../brand/Crest';

interface NavItem {
  label: string;
  to: string;
  end?: boolean;
  children?: { label: string; to: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: '首页', to: '/', end: true },
  { label: '关于政府', to: '/about' },
  { label: '新闻公告', to: '/news' },
  {
    label: '公民服务',
    to: '/services',
    children: [
      { label: '服务总览', to: '/services' },
      { label: '子域名注册', to: '/services/subdomain' },
    ],
  },
  { label: '政务公开', to: '/policy' },
  { label: '常见问题', to: '/faq' },
  { label: '联系我们', to: '/contact' },
];

/** 站头：品牌区 + 主导航（含公民服务下拉、移动端折叠）
 *  说明：由 Layout 以 key={pathname} 渲染，路由切换时自动重置菜单状态 */
export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const handleParentClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // 移动端：点击“公民服务”先展开子菜单
    if (mobileOpen) {
      event.preventDefault();
      setServicesOpen((open) => !open);
    }
  };

  return (
    <header className='site-header'>
      <div className='container site-header__inner'>
        <Link to='/' className='brand' aria-label='返回门户首页'>
          <Crest size={44} />
          <span className='brand__text'>
            <span className='brand__name'>
              gov<span className='tld'>.dn42</span>
            </span>
            <span className='brand__full'>DN42 联合自治政府</span>
          </span>
        </Link>
        <button type='button' className='nav-toggle' aria-expanded={mobileOpen} aria-controls='site-nav' onClick={() => setMobileOpen((open) => !open)}>
          <span aria-hidden='true'>☰</span> 菜单
        </button>
      </div>

      <nav className={`site-nav${mobileOpen ? ' is-open' : ''}`} id='site-nav' aria-label='主导航'>
        <ul className='container site-nav__list'>
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <li key={item.to} className={`has-sub${servicesOpen ? ' open' : ''}`}>
                <NavLink to={item.to} onClick={handleParentClick}>
                  {item.label}
                </NavLink>
                <ul className='sub'>
                  {item.children.map((child) => (
                    <li key={child.to}>
                      <NavLink to={child.to} end={child.to === item.to}>
                        {child.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end}>
                  {item.label}
                </NavLink>
              </li>
            ),
          )}
        </ul>
      </nav>
    </header>
  );
}
