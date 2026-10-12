import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { Crest } from '../brand/Crest';

interface NavItem {
  labelKey: string;
  to: string;
  end?: boolean;
  children?: { labelKey: string; to: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.home', to: '/', end: true },
  { labelKey: 'nav.about', to: '/about' },
  { labelKey: 'nav.news', to: '/news' },
  {
    labelKey: 'nav.services',
    to: '/services',
    children: [
      { labelKey: 'nav.servicesOverview', to: '/services' },
      { labelKey: 'nav.subdomain', to: '/services/subdomain' },
    ],
  },
  { labelKey: 'nav.policy', to: '/policy' },
  { labelKey: 'nav.faq', to: '/faq' },
  { labelKey: 'nav.contact', to: '/contact' },
];

/** 站头：品牌区 + 主导航（含公民服务下拉、移动端折叠）
 *  说明：由 Layout 以 key={pathname} 渲染，路由切换时自动重置菜单状态 */
export function SiteHeader() {
  const { t } = useI18n();
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
        <Link to='/' className='brand' aria-label={t('common.siteName')}>
          <Crest size={44} />
          <span className='brand__text'>
            <span className='brand__name'>
              gov<span className='tld'>.dn42</span>
            </span>
            <span className='brand__full'>{t('common.siteName')}</span>
          </span>
        </Link>
        <button type='button' className='nav-toggle' aria-expanded={mobileOpen} aria-controls='site-nav' onClick={() => setMobileOpen((open) => !open)}>
          <span aria-hidden='true'>☰</span> {t('common.menu')}
        </button>
      </div>

      <nav className={`site-nav${mobileOpen ? ' is-open' : ''}`} id='site-nav' aria-label='主导航'>
        <ul className='container site-nav__list'>
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <li key={item.to} className={`has-sub${servicesOpen ? ' open' : ''}`}>
                <NavLink to={item.to} onClick={handleParentClick}>
                  {t(item.labelKey)}
                </NavLink>
                <ul className='sub'>
                  {item.children.map((child) => (
                    <li key={child.to}>
                      <NavLink to={child.to} end={child.to === item.to}>
                        {t(child.labelKey)}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end}>
                  {t(item.labelKey)}
                </NavLink>
              </li>
            ),
          )}
        </ul>
      </nav>
    </header>
  );
}
