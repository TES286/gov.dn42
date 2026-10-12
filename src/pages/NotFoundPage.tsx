import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { usePageTitle } from '../lib/usePageTitle';

export default function NotFoundPage() {
  const { t } = useI18n();
  usePageTitle(t('notFound.title'));

  return (
    <div className='container not-found'>
      <div className='not-found__code' aria-hidden='true'>
        4<span>0</span>4
      </div>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.body')}</p>
      <div className='not-found__actions'>
        <Link className='btn btn--primary' to='/'>
          {t('notFound.home')}
        </Link>
        <Link className='btn btn--outline' to='/services'>
          {t('notFound.toServices')}
        </Link>
      </div>
    </div>
  );
}
