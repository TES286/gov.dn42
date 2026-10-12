import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { faqs } from '../data/faq';
import { usePageTitle } from '../lib/usePageTitle';

export default function FaqPage() {
  const { t, pick } = useI18n();
  usePageTitle(t('faq.title'));

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('faq.title') }]} />
          <h1>{t('faq.title')}</h1>
          <p className='page-head__sub'>{t('faq.sub')}</p>
        </div>
      </div>

      <div className='container page-body'>
        <div className='accordion'>
          {faqs.map((entry) => (
            <details key={pick(entry.question)}>
              <summary>{pick(entry.question)}</summary>
              <div className='accordion__body'>
                <p>{pick(entry.answer)}</p>
              </div>
            </details>
          ))}
        </div>

        <div className='callout callout--spaced'>
          <p>
            <strong>{t('faq.notFoundTitle')}</strong>
            {t('faq.notFoundBody1')}
            <Link to='/contact'>{t('nav.contact')}</Link>
            {t('faq.notFoundBody2')}
            <a href='https://dn42.dev' target='_blank' rel='noreferrer'>
              {t('faq.wikiLink')}
            </a>
            {t('faq.notFoundBody3')}
          </p>
        </div>
      </div>
    </>
  );
}
