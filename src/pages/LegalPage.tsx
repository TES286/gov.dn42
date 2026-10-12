import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { usePageTitle } from '../lib/usePageTitle';

export default function LegalPage() {
  const { t } = useI18n();
  usePageTitle(t('legal.title'));

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('legal.title') }]} />
          <h1>{t('legal.title')}</h1>
          <p className='page-head__sub'>{t('legal.sub')}</p>
        </div>
      </div>

      <div className='container page-body'>
        <section className='about-section' aria-labelledby='legal-nature'>
          <h2 className='section-title' id='legal-nature'>
            {t('legal.natureTitle')}
          </h2>
          <p>{t('legal.natureBody')}</p>
        </section>

        <section className='about-section' aria-labelledby='legal-ip'>
          <h2 className='section-title' id='legal-ip'>
            {t('legal.ipTitle')}
          </h2>
          <p>{t('legal.ipBody')}</p>
        </section>

        <section className='about-section' aria-labelledby='legal-privacy'>
          <h2 className='section-title' id='legal-privacy'>
            {t('legal.privacyTitle')}
          </h2>
          <p>{t('legal.privacyBody')}</p>
        </section>

        <section className='about-section' aria-labelledby='legal-disclaimer'>
          <h2 className='section-title' id='legal-disclaimer'>
            {t('legal.disclaimerTitle')}
          </h2>
          <p>{t('legal.disclaimerBody')}</p>
        </section>

        <section className='about-section' aria-labelledby='legal-effective'>
          <h2 className='section-title' id='legal-effective'>
            {t('legal.effectiveTitle')}
          </h2>
          <p>{t('legal.effectiveBody')}</p>
        </section>
      </div>
    </>
  );
}
