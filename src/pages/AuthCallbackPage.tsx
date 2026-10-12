import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { ApiError, authApi, isServiceUnavailable } from '../lib/api';
import { consumeOidcSession, OIDC_PROVIDERS, saveOidcUser } from '../lib/oidc';
import { usePageTitle } from '../lib/usePageTitle';

type CallbackState =
  | { kind: 'processing' }
  | { kind: 'success' }
  | { kind: 'offline' }
  | { kind: 'error'; message: string };

export default function AuthCallbackPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  usePageTitle(t('subdomain.authCallbackProcessing'));
  const [state, setState] = useState<CallbackState>({ kind: 'processing' });

  useEffect(() => {
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const returnedState = params.get('state');

      const session = consumeOidcSession();

      if (!session) {
        setState({ kind: 'error', message: t('subdomain.authErrorState') });
        return;
      }
      if (returnedState !== session.state) {
        setState({ kind: 'error', message: t('subdomain.authErrorState') });
        return;
      }
      if (!code) {
        setState({ kind: 'error', message: t('subdomain.authErrorMissingCode') });
        return;
      }

      const provider = OIDC_PROVIDERS.find((p) => p.id === session.providerId);
      if (!provider) {
        setState({ kind: 'error', message: t('subdomain.authErrorProvider') });
        return;
      }

      const redirectUri = `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`;

      try {
        const result = await authApi.callback({
          providerId: session.providerId,
          code,
          codeVerifier: session.codeVerifier,
          redirectUri,
        });
        saveOidcUser(result.user);
        setState({ kind: 'success' });
        setTimeout(() => navigate('/services/subdomain'), 1500);
      } catch (err) {
        if (isServiceUnavailable(err)) {
          setState({ kind: 'offline' });
        } else if (err instanceof ApiError) {
          setState({ kind: 'error', message: err.message });
        } else {
          setState({ kind: 'error', message: t('subdomain.authErrorState') });
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className='container not-found'>
      {state.kind === 'processing' && (
        <>
          <h1>{t('subdomain.authCallbackProcessing')}</h1>
          <p>{t('subdomain.authCallbackProcessing')}</p>
        </>
      )}
      {state.kind === 'success' && (
        <>
          <div className='not-found__code' aria-hidden='true'>
            ✓
          </div>
          <h1>{t('subdomain.authCallbackSuccess')}</h1>
          <p>
            <Link to='/services/subdomain'>{t('subdomain.authCallbackBack')}</Link>
          </p>
        </>
      )}
      {state.kind === 'offline' && (
        <>
          <div className='not-found__code' aria-hidden='true'>
            !
          </div>
          <h1>{t('subdomain.authErrorTitle')}</h1>
          <p>{t('subdomain.submitOfflineBody')}</p>
          <p>
            <Link to='/services/subdomain'>{t('subdomain.authCallbackBack')}</Link>
          </p>
        </>
      )}
      {state.kind === 'error' && (
        <>
          <div className='not-found__code' aria-hidden='true'>
            ×
          </div>
          <h1>{t('subdomain.authErrorTitle')}</h1>
          <p>{state.message}</p>
          <div className='not-found__actions'>
            <Link className='btn btn--primary' to='/services/subdomain'>
              {t('subdomain.authCallbackBack')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
