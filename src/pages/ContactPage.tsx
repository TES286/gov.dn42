import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { usePageTitle } from '../lib/usePageTitle';

export default function ContactPage() {
  const { t } = useI18n();
  usePageTitle(t('contact.title'));

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('contact.title') }]} />
          <h1>{t('contact.title')}</h1>
          <p className='page-head__sub'>{t('contact.sub')}</p>
        </div>
      </div>

      <div className='container page-body'>
        <div className='contact-grid'>
          <Link className='contact-card' to='/report'>
            <h3>{t('contact.reportCta')}</h3>
            <span className='card__more'>{t('contact.reportCtaDesc')} →</span>
          </Link>
          <Link className='contact-card' to='/feedback'>
            <h3>{t('contact.feedbackCta')}</h3>
            <span className='card__more'>{t('contact.feedbackCtaDesc')} →</span>
          </Link>
        </div>

        <div className='callout callout--gold callout--spaced'>
          <p>
            <strong>{t('contact.replyTitle')}</strong>
            {t('contact.replyBody')}
          </p>
        </div>
      </div>
    </>
  );
}
