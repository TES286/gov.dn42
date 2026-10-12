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
