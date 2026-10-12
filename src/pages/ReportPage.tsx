import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { ApiError, isServiceUnavailable, submissionsApi } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';

const CATEGORIES = [
  { value: 'misconduct', labelKey: 'report.catMisconduct' },
  { value: 'service', labelKey: 'report.catService' },
  { value: 'dispute', labelKey: 'report.catDispute' },
  { value: 'other', labelKey: 'report.catOther' },
] as const;

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; id: string }
  | { kind: 'error'; title: string }
  | { kind: 'offline' };

export default function ReportPage() {
  const { t } = useI18n();
  usePageTitle(t('report.title'));

  const [category, setCategory] = useState<string>(CATEGORIES[0].value);
  const [target, setTarget] = useState('');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!content.trim()) {
      setSubmit({ kind: 'error', title: t('report.errContent') });
      return;
    }
    if (content.trim().length < 10) {
      setSubmit({ kind: 'error', title: t('report.errContentShort') });
      return;
    }

    setSubmit({ kind: 'submitting' });
    try {
      const receipt = await submissionsApi.submit({
        type: 'report',
        category,
        content: content.trim(),
        target: target.trim() || undefined,
        contact: contact.trim() || undefined,
      });
      setSubmit({ kind: 'success', id: receipt.id });
    } catch (err) {
      if (isServiceUnavailable(err)) {
        setSubmit({ kind: 'offline' });
      } else if (err instanceof ApiError) {
        setSubmit({ kind: 'error', title: err.message });
      } else {
        setSubmit({ kind: 'error', title: t('report.submitErr') });
      }
    }
  };

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('report.title') }]} />
          <h1>{t('report.title')}</h1>
          <p className='page-head__sub'>{t('report.sub')}</p>
        </div>
      </div>

      <div className='container page-body'>
        <div className='callout' role='note'>
          <p>
            <strong>{t('report.intro')}</strong>
            {t('report.introBody')}
          </p>
        </div>

        <section className='about-section' aria-labelledby='report-form'>
          <h2 className='section-title' id='report-form'>
            {t('report.title')}
          </h2>

          <form className='form-panel' onSubmit={handleSubmit} noValidate>
            <div className='form-grid'>
              <div className='form-field'>
                <label htmlFor='report-category'>{t('report.categoryLabel')}</label>
                <select id='report-category' value={category} onChange={(event) => setCategory(event.target.value)}>
                  {CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div className='form-field'>
                <label htmlFor='report-target'>{t('report.targetLabel')}</label>
                <input
                  id='report-target'
                  type='text'
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  aria-describedby='report-target-hint'
                />
                <span className='form-hint' id='report-target-hint'>
                  {t('report.targetHint')}
                </span>
              </div>

              <div className='form-field form-field--full'>
                <label htmlFor='report-content'>
                  {t('report.contentLabel')}
                  <span className='req' aria-hidden='true'>
                    *
                  </span>
                </label>
                <textarea
                  id='report-content'
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={t('report.contentPlaceholder')}
                  rows={6}
                />
              </div>

              <div className='form-field form-field--full'>
                <label htmlFor='report-contact'>{t('report.contactLabel')}</label>
                <input
                  id='report-contact'
                  type='text'
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  aria-describedby='report-contact-hint'
                />
                <span className='form-hint' id='report-contact-hint'>
                  {t('report.contactHint')}
                </span>
              </div>

              <div className='form-actions'>
                <button type='submit' className='btn btn--primary' disabled={submit.kind === 'submitting'}>
                  {submit.kind === 'submitting' ? t('report.submitting') : t('report.submit')}
                </button>
              </div>
            </div>

            {submit.kind === 'success' && (
              <div className='form-status form-status--ok' role='status'>
                <p>
                  <strong>{t('report.submitOk')}</strong>
                  {t('report.submitOkBody').replace('{id}', submit.id)}
                </p>
              </div>
            )}

            {submit.kind === 'error' && (
              <div className='form-status form-status--error' role='alert'>
                <p>{submit.title}</p>
              </div>
            )}

            {submit.kind === 'offline' && (
              <div className='form-status form-status--warn' role='status'>
                <p>{t('report.submitOffline')}</p>
                <p>
                  <Link to='/contact'>{t('contact.title')}</Link>
                </p>
              </div>
            )}
          </form>
        </section>
      </div>
    </>
  );
}
