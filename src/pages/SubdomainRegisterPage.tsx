import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { ApiError, isServiceUnavailable, subdomainApi } from '../lib/api';
import { clearOidcUser, loadOidcUser, OIDC_PROVIDERS, redirectToAuthorize, type OidcUser } from '../lib/oidc';
import { usePageTitle } from '../lib/usePageTitle';

type AvailabilityState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ok'; message: string }
  | { kind: 'bad'; message: string }
  | { kind: 'info'; message: string };

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; id: string; name: string }
  | { kind: 'error'; title: string }
  | { kind: 'offline' };

const NAME_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

const PURPOSE_OPTIONS = [
  { value: 'personal', labelKey: 'subdomain.purposePersonal' },
  { value: 'project', labelKey: 'subdomain.purposeProject' },
  { value: 'service', labelKey: 'subdomain.purposeService' },
  { value: 'other', labelKey: 'subdomain.purposeOther' },
] as const;

/** NS 记录验证：FQDN，每行一个 */
const NS_PATTERN = /^[a-z0-9]([a-z0-9.-]{0,253}[a-z0-9])?$/i;
function parseLines(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
function isValidNs(value: string): boolean {
  return NS_PATTERN.test(value) && value.length <= 253;
}
/** DS 记录粗验：keyTag algorithm digestType digest */
const DS_PATTERN = /^\d{1,5}\s+\d{1,3}\s+[124]\s+[0-9a-fA-F]{20,128}$/;
function isValidDs(value: string): boolean {
  return DS_PATTERN.test(value.trim());
}

export default function SubdomainRegisterPage() {
  const { t } = useI18n();
  usePageTitle(t('subdomain.title'));

  const [user, setUser] = useState<OidcUser | null>(() => loadOidcUser());

  const handleLogin = async (providerId: string) => {
    const provider = OIDC_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;
    try {
      await redirectToAuthorize(provider);
    } catch (err) {
      // client_id 未配置等错误：提示用户
      console.error(err);
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleLogout = () => {
    clearOidcUser();
    setUser(null);
  };

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('nav.services'), to: '/services' }, { label: t('subdomain.title') }]} />
          <h1>{t('subdomain.title')}</h1>
          <p className='page-head__sub'>{t('subdomain.sub')}</p>
        </div>
      </div>

      <div className='container page-body'>
        <section className='about-section' aria-labelledby='subdomain-auth'>
          <h2 className='section-title' id='subdomain-auth'>
            {t('subdomain.authTitle')}
          </h2>
          {user ? (
            <div className='callout callout--gold'>
              <p>
                <strong>{t('subdomain.loggedInAs')}：</strong>
                {user.name ?? user.sub}
                {user.dn42 && ` · dn42: ${user.dn42}`}
                {user.email && ` · ${user.email}`}
              </p>
              <p>
                <button type='button' className='btn btn--outline' onClick={handleLogout}>
                  {t('subdomain.logout')}
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className='callout' role='note'>
                <p>
                  <strong>{t('subdomain.authRequired')}</strong>
                  {t('subdomain.authRequiredBody')}
                </p>
              </div>
              <p>{t('subdomain.loginIntro')}</p>
              <div className='hero__actions'>
                {OIDC_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type='button'
                    className='btn btn--outline'
                    onClick={() => void handleLogin(provider.id)}
                  >
                    {t('subdomain.loginWith').replace('{provider}', provider.displayName)}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {user && (
          <SubdomainForm user={user} t={t} />
        )}
      </div>
    </>
  );
}

function SubdomainForm({ user, t }: { user: OidcUser; t: (key: string) => string }) {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState<string>(PURPOSE_OPTIONS[0].value);
  const [ns, setNs] = useState('');
  const [ds, setDs] = useState('');
  const [contact, setContact] = useState(user.email ?? '');
  const [note, setNote] = useState('');
  const [agree, setAgree] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>({ kind: 'idle' });
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' });

  const validateName = (raw: string): string | null => {
    const candidate = raw.trim().toLowerCase();
    if (!candidate) return t('subdomain.errNameEmpty');
    if (candidate.length < 2) return t('subdomain.errNameShort');
    if (!NAME_PATTERN.test(candidate)) {
      return t('subdomain.errNameFormat');
    }
    return null;
  };

  const handleCheck = async () => {
    const error = validateName(name);
    setNameError(error);
    if (error) return;

    const candidate = name.trim().toLowerCase();
    setAvailability({ kind: 'checking' });
    try {
      const result = await subdomainApi.availability(candidate);
      if (result.available) {
        setAvailability({ kind: 'ok', message: `"${candidate}.gov.dn42" ${t('subdomain.availOk')}` });
      } else {
        setAvailability({ kind: 'bad', message: `"${candidate}.gov.dn42" ${t('subdomain.availBad')}` });
      }
    } catch (err) {
      setAvailability({
        kind: 'info',
        message: isServiceUnavailable(err)
          ? t('subdomain.availOffline')
          : err instanceof ApiError
            ? err.message
            : t('subdomain.availFail'),
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const error = validateName(name);
    setNameError(error);
    if (error) return;

    if (!contact.trim()) {
      setSubmit({ kind: 'error', title: t('subdomain.errContact') });
      return;
    }
    const nsList = parseLines(ns);
    if (nsList.length < 2) {
      setSubmit({ kind: 'error', title: t('subdomain.errNsTooFew') });
      return;
    }
    if (!nsList.every(isValidNs)) {
      setSubmit({ kind: 'error', title: t('subdomain.errNsFormat') });
      return;
    }
    const dsList = ds.trim() ? parseLines(ds) : [];
    if (dsList.length > 0 && !dsList.every(isValidDs)) {
      setSubmit({ kind: 'error', title: t('subdomain.errDsFormat') });
      return;
    }
    if (!agree) {
      setSubmit({ kind: 'error', title: t('subdomain.errAgree') });
      return;
    }

    setSubmit({ kind: 'submitting' });
    try {
      const receipt = await subdomainApi.register({
        name: name.trim().toLowerCase(),
        purpose,
        ns: nsList,
        ds: dsList.length > 0 ? dsList : undefined,
        contact: contact.trim(),
        note: note.trim() || undefined,
        agree: true,
        auth: { providerId: user.providerId, sub: user.sub },
      });
      setSubmit({ kind: 'success', id: receipt.id, name: receipt.name });
    } catch (err) {
      if (isServiceUnavailable(err)) {
        setSubmit({ kind: 'offline' });
      } else if (err instanceof ApiError) {
        setSubmit({ kind: 'error', title: err.message });
      } else {
        setSubmit({ kind: 'error', title: t('subdomain.submitErrGeneric') });
      }
    }
  };

  return (
    <>
      <section className='about-section' aria-labelledby='subdomain-guide'>
        <h2 className='section-title' id='subdomain-guide'>
          {t('subdomain.guideTitle')}
        </h2>
        <ol className='steps'>
          <li>
            <strong>{t('subdomain.step1Title')}</strong>
            {t('subdomain.step1Desc')}
          </li>
          <li>
            <strong>{t('subdomain.step2Title')}</strong>
            {t('subdomain.step2Desc')}
          </li>
          <li>
            <strong>{t('subdomain.step3Title')}</strong>
            {t('subdomain.step3Desc')}
          </li>
        </ol>
      </section>

      <section className='about-section' aria-labelledby='subdomain-form'>
        <h2 className='section-title' id='subdomain-form'>
          {t('subdomain.formTitle')}
        </h2>

        <form className='form-panel' onSubmit={handleSubmit} noValidate>
          <div className='form-grid'>
            <div className={`form-field form-field--full${nameError ? ' has-error' : ''}`}>
              <label htmlFor='sub-name'>
                {t('subdomain.nameLabel')}
                <span className='req' aria-hidden='true'>
                  *
                </span>
              </label>
              <div className='input-group'>
                <input
                  id='sub-name'
                  type='text'
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t('subdomain.namePlaceholder')}
                  autoComplete='off'
                  aria-describedby='sub-name-hint'
                />
                <span className='suffix' aria-hidden='true'>
                  {t('subdomain.suffix')}
                </span>
                <button type='button' className='btn btn--outline' onClick={handleCheck} disabled={availability.kind === 'checking'}>
                  {availability.kind === 'checking' ? t('subdomain.checking') : t('subdomain.checkAvail')}
                </button>
              </div>
              {nameError ? (
                <p className='field-error' role='alert'>
                  {nameError}
                </p>
              ) : (
                <p className='form-hint' id='sub-name-hint'>
                  {t('subdomain.nameHint')}
                </p>
              )}
              {availability.kind !== 'idle' && (
                <p className={`avail-status avail-status--${availability.kind === 'ok' ? 'ok' : availability.kind === 'bad' ? 'bad' : 'info'}`} role='status'>
                  {availability.kind === 'checking' ? t('subdomain.checkingMsg') : availability.message}
                </p>
              )}
            </div>

            <div className='form-field'>
              <label htmlFor='sub-purpose'>{t('subdomain.purposeLabel')}</label>
              <select id='sub-purpose' value={purpose} onChange={(event) => setPurpose(event.target.value)}>
                {PURPOSE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div className='form-field'>
              <label htmlFor='sub-contact'>
                {t('subdomain.contactLabel')}
                <span className='req' aria-hidden='true'>
                  *
                </span>
              </label>
              <input
                id='sub-contact'
                type='email'
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder={t('subdomain.contactPlaceholder')}
                autoComplete='email'
              />
            </div>

            <div className='form-field form-field--full'>
              <label htmlFor='sub-ns'>
                {t('subdomain.nsLabel')}
                <span className='req' aria-hidden='true'>
                  *
                </span>
              </label>
              <textarea
                id='sub-ns'
                value={ns}
                onChange={(event) => setNs(event.target.value)}
                placeholder={t('subdomain.nsPlaceholder')}
                rows={3}
                aria-describedby='sub-ns-hint'
              />
              <span className='form-hint' id='sub-ns-hint'>
                {t('subdomain.nsHint')}
              </span>
            </div>

            <div className='form-field form-field--full'>
              <label htmlFor='sub-ds'>{t('subdomain.dsLabel')}</label>
              <textarea
                id='sub-ds'
                value={ds}
                onChange={(event) => setDs(event.target.value)}
                placeholder={t('subdomain.dsPlaceholder')}
                rows={3}
                aria-describedby='sub-ds-hint'
              />
              <span className='form-hint' id='sub-ds-hint'>
                {t('subdomain.dsHint')}
              </span>
            </div>

            <div className='form-field form-field--full'>
              <label htmlFor='sub-note'>{t('subdomain.noteLabel')}</label>
              <textarea
                id='sub-note'
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t('subdomain.notePlaceholder')}
                rows={4}
              />
            </div>

            <div className='form-field form-field--full'>
              <label className='form-check'>
                <input type='checkbox' checked={agree} onChange={(event) => setAgree(event.target.checked)} />
                <span>
                  {t('subdomain.agreeText')}
                  <Link to='/policy'>{t('subdomain.agreePolicy')}</Link>
                  {t('subdomain.agreeSuffix')}
                </span>
              </label>
            </div>

            <div className='form-actions'>
              <button type='submit' className='btn btn--primary' disabled={submit.kind === 'submitting'}>
                {submit.kind === 'submitting' ? t('subdomain.submitting') : t('subdomain.submit')}
              </button>
              <span className='form-hint'>{t('subdomain.submitHint')}</span>
            </div>
          </div>

          {submit.kind === 'success' && (
            <div className='form-status form-status--ok' role='status'>
              <p>
                <strong>{t('subdomain.submitOkTitle')}</strong>
                {t('subdomain.receiptId')}
                <code>{submit.id}</code>，{t('subdomain.receiptName')}
                <code>{submit.name}.gov.dn42</code>。
              </p>
              <p>{t('subdomain.submitOkBody')}</p>
            </div>
          )}

          {submit.kind === 'error' && (
            <div className='form-status form-status--error' role='alert'>
              <p>{submit.title}</p>
            </div>
          )}

          {submit.kind === 'offline' && (
            <div className='form-status form-status--warn' role='status'>
              <p>
                <strong>{t('subdomain.submitOfflineTitle')}</strong>
                {t('subdomain.submitOfflineBody')}
              </p>
              <p>{t('subdomain.submitOfflineNote')}</p>
            </div>
          )}
        </form>
      </section>

      <section className='about-section' aria-labelledby='subdomain-rules'>
        <h2 className='section-title' id='subdomain-rules'>
          {t('subdomain.rulesTitle')}
        </h2>
        <div className='callout'>
          <p>{t('subdomain.rulesBody')}</p>
        </div>
      </section>
    </>
  );
}
