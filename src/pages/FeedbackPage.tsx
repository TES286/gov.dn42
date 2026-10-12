import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { ApiError, isServiceUnavailable, submissionsApi } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';

const CATEGORIES = [
  { value: 'website', labelKey: 'feedback.catWebsite' },
  { value: 'service', labelKey: 'feedback.catService' },
  { value: 'policy', labelKey: 'feedback.catPolicy' },
  { value: 'other', labelKey: 'feedback.catOther' },
] as const;

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; id: string }
  | { kind: 'error'; title: string }
  | { kind: 'offline' };

export default function FeedbackPage() {
  const { t } = useI18n();
  usePageTitle(t('feedback.title'));

  const [category, setCategory] = useState<string>(CATEGORIES[0].value);
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!content.trim()) {
      setSubmit({ kind: 'error', title: t('feedback.errContent') });
      return;
    }
    if (content.trim().length < 10) {
      setSubmit({ kind: 'error', title: t('feedback.errContentShort') });
      return;
    }

    setSubmit({ kind: 'submitting' });
    try {
      const receipt = await submissionsApi.submit({
        type: 'feedback',
        category,
        content: content.trim(),
        contact: contact.trim() || undefined,
      });
      setSubmit({ kind: 'success', id: receipt.id });
    } catch (err) {
      if (isServiceUnavailable(err)) {
        setSubmit({ kind: 'offline' });
      } else if (err instanceof ApiError) {
        setSubmit({ kind: 'error', title: err.message });
      } else {
        setSubmit({ kind: 'error', title: t('feedback.submitErr') });
      }
    }
  };

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('feedback.title') }]} />
          <h1>{t('feedback.title')}</h1>
          <p className='page-head__sub'>{t('feedback.sub')}</p>
        </div>
      </div>

      <div className='container page-body'>
        <div className='callout' role='note'>
          <p>
            <strong>{t('feedback.intro')}</strong>
            {t('feedback.introBody')}
          </p>
        </div>

        <section className='about-section' aria-labelledby='feedback-form'>
          <h2 className='section-title' id='feedback-form'>
            {t('feedback.title')}
          </h2>

          <form className='form-panel' onSubmit={handleSubmit} noValidate>
            <div className='form-grid'>
              <div className='form-field'>
                <label htmlFor='feedback-category'>{t('feedback.categoryLabel')}</label>
                <select id='feedback-category' value={category} onChange={(event) => setCategory(event.target.value)}>
                  {CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div className='form-field form-field--full'>
                <label htmlFor='feedback-content'>
                  {t('feedback.contentLabel')}
                  <span className='req' aria-hidden='true'>
                    *
                  </span>
                </label>
                <textarea
                  id='feedback-content'
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={t('feedback.contentPlaceholder')}
                  rows={6}
                />
              </div>

              <div className='form-field form-field--full'>
                <label htmlFor='feedback-contact'>{t('feedback.contactLabel')}</label>
                <input
                  id='feedback-contact'
                  type='text'
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  aria-describedby='feedback-contact-hint'
                />
                <span className='form-hint' id='feedback-contact-hint'>
                  {t('feedback.contactHint')}
                </span>
              </div>

              <div className='form-actions'>
                <button type='submit' className='btn btn--primary' disabled={submit.kind === 'submitting'}>
                  {submit.kind === 'submitting' ? t('feedback.submitting') : t('feedback.submit')}
                </button>
              </div>
            </div>

            {submit.kind === 'success' && (
              <div className='form-status form-status--ok' role='status'>
                <p>
                  <strong>{t('feedback.submitOk')}</strong>
                  {t('feedback.submitOkBody').replace('{id}', submit.id)}
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
                <p>{t('feedback.submitOffline')}</p>
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
