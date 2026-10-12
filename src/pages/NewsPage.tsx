import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { newsItems } from '../data/news';
import { usePageTitle } from '../lib/usePageTitle';

export default function NewsPage() {
  const { t, pick } = useI18n();
  usePageTitle(t('news.title'));

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('news.title') }]} />
          <h1>{t('news.title')}</h1>
          <p className='page-head__sub'>{t('news.sub')}</p>
        </div>
      </div>

      <div className='container page-body'>
        <div className='news-list'>
          {newsItems.map((item) => {
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
        <p className='text-muted'>{t('news.archiveNote')}</p>
      </div>
    </>
  );
}
