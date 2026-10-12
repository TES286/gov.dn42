import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { Crest } from '../brand/Crest';

/** 页脚：栏目导航 + 相关站点 + 版权与虚构声明 */
export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className='site-footer'>
      <div className='container site-footer__grid'>
        <div>
          <div className='site-footer__brand'>
            <Crest size={34} />
            <span>
              gov<span className='tld'>.dn42</span>
            </span>
          </div>
          <p className='site-footer__desc'>{t('footer.desc')}</p>
        </div>

        <nav aria-label={t('footer.colSections')}>
          <h4>{t('footer.colSections')}</h4>
          <ul>
            <li>
              <Link to='/about'>{t('nav.about')}</Link>
            </li>
            <li>
              <Link to='/news'>{t('nav.news')}</Link>
            </li>
            <li>
              <Link to='/services'>{t('nav.services')}</Link>
            </li>
            <li>
              <Link to='/policy'>{t('nav.policy')}</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label={t('footer.colServices')}>
          <h4>{t('footer.colServices')}</h4>
          <ul>
            <li>
              <Link to='/services/subdomain'>{t('nav.subdomain')}</Link>
            </li>
            <li>
              <Link to='/report'>{t('report.title')}</Link>
            </li>
            <li>
              <Link to='/feedback'>{t('feedback.title')}</Link>
            </li>
            <li>
              <Link to='/faq'>{t('nav.faq')}</Link>
            </li>
            <li>
              <Link to='/legal'>{t('topbar.legal')}</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label={t('footer.colRelated')}>
          <h4>{t('footer.colRelated')}</h4>
          <ul>
            <li>
              <a href='https://dn42.dev' target='_blank' rel='noreferrer'>
                {t('footer.relatedWiki')}
              </a>
            </li>
            <li>
              <a href='https://git.dn42.dev/dn42/registry' target='_blank' rel='noreferrer'>
                {t('footer.relatedRegistry')}
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className='site-footer__bottom'>
        <div className='container'>
          <p>{t('footer.copyright').replace('{year}', String(year))}</p>
          <p className='site-footer__fiction'>{t('footer.fiction')}</p>
        </div>
      </div>
    </footer>
  );
}
