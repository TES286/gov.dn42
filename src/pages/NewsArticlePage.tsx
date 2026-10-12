import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { newsItems } from '../data/news';
import { usePageTitle } from '../lib/usePageTitle';

export default function NewsArticlePage() {
  const { slug } = useParams();
  const { t, pick } = useI18n();
  const item = newsItems.find((entry) => entry.slug === slug);
  usePageTitle(item ? pick(item.title) : t('news.articleTitle'));

  if (!item || !item.published) {
    return (
      <div className='container not-found'>
        <div className='not-found__code' aria-hidden='true'>
          <span>4</span>0<span>4</span>
        </div>
        <h1>{t('news.articleNotExistTitle')}</h1>
        <p>{t('news.articleNotExist')}</p>
        <div className='not-found__actions'>
          <Link className='btn btn--primary' to='/news'>
            {t('news.backToList')}
          </Link>
        </div>
      </div>
    );
  }

  const body = item.body ? pick(item.body) : [];

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('news.title'), to: '/news' }, { label: t('news.articleTitle') }]} />
          <h1>{t('news.title')}</h1>
        </div>
      </div>

      <div className='container page-body'>
        <article className='article'>
          <div className='article__meta'>
            <span>
              {t('news.dateLabel')}：{item.date}
            </span>
            <span>
              {t('news.orgLabel')}：{pick(item.org)}
            </span>
          </div>
          <h2>{pick(item.title)}</h2>
          {body.map((paragraph, i) => (
            <p key={paragraph.slice(0, 16) + i}>{paragraph}</p>
          ))}
          <div className='article__footer'>
            <Link to='/news'>{t('news.backToList')}</Link>
            {item.slug === 'subdomain-measures-draft' && <Link to='/policy'>{t('news.viewPolicy')}</Link>}
          </div>
        </article>
      </div>
    </>
  );
}
