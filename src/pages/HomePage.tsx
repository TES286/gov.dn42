import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { ServiceCard } from '../components/ui/ServiceCard';
import { departments } from '../data/departments';
import { newsItems } from '../data/news';
import { services } from '../data/services';
import { usePageTitle } from '../lib/usePageTitle';

function NewsPreview() {
  const { pick } = useI18n();

  return (
    <div className='news-list'>
      {newsItems.slice(0, 3).map((item) => {
        const content = (
          <>
            <span className='news-item__date'>{item.date}</span>
            <span>
              <span className='news-item__title'>{pick(item.title)}</span>
              <span className='news-item__summary'>{pick(item.summary)}</span>
            </span>
            <span className='news-item__org'>{pick(item.org)}</span>
          </>
        );
        return item.published ? (
          <Link key={item.slug} className='news-item' to={`/news/${item.slug}`}>
            {content}
          </Link>
        ) : (
          <div key={item.slug} className='news-item'>
            {content}
          </div>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const { t, pick } = useI18n();
  usePageTitle();

  return (
    <>
      <section className='hero'>
        <div className='container hero__inner'>
          <p className='hero__kicker'>{t('home.kicker')}</p>
          <h1>{t('home.title')}</h1>
          <p className='hero__lead'>{t('home.lead')}</p>
          <div className='hero__actions'>
            <Link className='btn btn--gold' to='/services'>
              {t('home.ctaServices')}
            </Link>
            <Link className='btn btn--ghost' to='/about'>
              {t('home.ctaAbout')}
            </Link>
          </div>
        </div>
      </section>

      <section className='section section--tint' aria-labelledby='home-services'>
        <div className='container'>
          <div className='section-head'>
            <h2 className='section-title' id='home-services'>
              {t('home.servicesTitle')}
              <span className='section-title__sub'>{t('home.servicesSub')}</span>
            </h2>
            <Link className='section-more' to='/services'>
              {t('home.viewAll')}
            </Link>
          </div>
          <div className='card-grid'>
            {services.slice(0, 4).map((service) => (
              <ServiceCard key={pick(service.name)} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section className='section' aria-labelledby='home-news'>
        <div className='container'>
          <div className='section-head'>
            <h2 className='section-title' id='home-news'>
              {t('home.newsTitle')}
              <span className='section-title__sub'>{t('home.newsSub')}</span>
            </h2>
            <Link className='section-more' to='/news'>
              {t('home.viewMore')}
            </Link>
          </div>
          <NewsPreview />
        </div>
      </section>

      <section className='section section--tint' aria-labelledby='home-departments'>
        <div className='container'>
          <div className='section-head'>
            <h2 className='section-title' id='home-departments'>
              {t('home.deptsTitle')}
              <span className='section-title__sub'>{t('home.deptsSub')}</span>
            </h2>
            <Link className='section-more' to='/about#departments'>
              {t('home.viewOrg')}
            </Link>
          </div>
          <div className='card-grid card-grid--3'>
            {departments.map((dept) => (
              <Link key={pick(dept.name)} className='card card--dept' to='/about#departments'>
                <h3>{pick(dept.name)}</h3>
                <p>{pick(dept.duty)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
