import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { ServiceCard } from '../components/ui/ServiceCard';
import { services } from '../data/services';
import { usePageTitle } from '../lib/usePageTitle';

export default function ServicesPage() {
  const { t, pick } = useI18n();
  usePageTitle(t('services.title'));

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('services.title') }]} />
          <h1>{t('services.title')}</h1>
          <p className='page-head__sub'>{t('services.sub')}</p>
        </div>
      </div>

      <div className='container page-body'>
        <div className='callout callout--gold' role='note'>
          <p>
            <strong>{t('services.statusNote')}</strong>
            {t('services.statusNoteBody')}
          </p>
        </div>

        <div className='card-grid card-grid--3' aria-label={t('services.title')}>
          {services.map((service) => (
            <ServiceCard key={pick(service.name)} service={service} />
          ))}
        </div>

        <div className='callout callout--spaced'>
          <p>
            <strong>{t('services.note')}</strong>
            {t('services.noteBody1')}
            <Link to='/policy'>{t('nav.policy')}</Link>
            {t('services.noteBody2')}
            <Link to='/faq'>{t('nav.faq')}</Link>
            {t('services.noteBody3')}
            <Link to='/contact'>{t('nav.contact')}</Link>
            {t('services.noteBody4')}
          </p>
        </div>
      </div>
    </>
  );
}
