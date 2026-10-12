import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { adminApi, ApiError, isServiceUnavailable, type SubdomainApplication } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';

type Filter = 'all' | 'pending' | 'approved' | 'rejected';
type LoadState =
  | { kind: 'loading' }
  | { kind: 'ok'; items: SubdomainApplication[] }
  | { kind: 'error'; message: string }
  | { kind: 'offline' };

export default function AdminPage() {
  const { t } = useI18n();
  usePageTitle(t('admin.title'));

  const [filter, setFilter] = useState<Filter>('pending');
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 加载列表：随 filter 与 refreshKey 变化自动触发
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setState({ kind: 'loading' });
      try {
        const result = await adminApi.list(filter === 'all' ? undefined : filter);
        if (!cancelled) setState({ kind: 'ok', items: result.items });
      } catch (err) {
        if (cancelled) return;
        if (isServiceUnavailable(err)) {
          setState({ kind: 'offline' });
        } else if (err instanceof ApiError) {
          setState({ kind: 'error', message: err.message });
        } else {
          setState({ kind: 'error', message: t('admin.loadError') });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, refreshKey, t]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleApprove = async (id: string, name: string) => {
    try {
      await adminApi.approve(id);
      setToast(t('admin.approvedToast').replace('{name}', name));
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : t('admin.loadError'));
    }
  };

  const handleReject = async (id: string, name: string) => {
    const reason = window.prompt(t('admin.rejectReasonPrompt'));
    if (!reason || !reason.trim()) return;
    try {
      await adminApi.reject(id, reason.trim());
      setToast(t('admin.rejectedToast').replace('{name}', name));
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : t('admin.loadError'));
    }
  };

  const tabs: { id: Filter; label: string }[] = [
    { id: 'pending', label: t('admin.tabPending') },
    { id: 'approved', label: t('admin.tabApproved') },
    { id: 'rejected', label: t('admin.tabRejected') },
    { id: 'all', label: t('admin.tabAll') },
  ];

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('admin.title') }]} />
          <h1>{t('admin.title')}</h1>
          <p className='page-head__sub'>{t('admin.sub')}</p>
        </div>
      </div>

      <div className='container page-body'>
        <div className='admin-tabs'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type='button'
              className={`admin-tab${filter === tab.id ? ' is-active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <button type='button' className='btn btn--outline admin-refresh' onClick={refresh}>
            {t('admin.refresh')}
          </button>
        </div>

        {toast && (
          <div className='form-status form-status--ok' role='status'>
            <p>{toast}</p>
          </div>
        )}

        {state.kind === 'loading' && <p>{t('admin.loading')}</p>}
        {state.kind === 'error' && (
          <div className='form-status form-status--error' role='alert'>
            <p>{state.message}</p>
          </div>
        )}
        {state.kind === 'offline' && (
          <div className='callout' role='note'>
            <p>{t('admin.offlineHint')}</p>
          </div>
        )}
        {state.kind === 'ok' && state.items.length === 0 && (
          <p className='text-muted'>{t('admin.noItems').replace('{status}', t(`admin.status${filter.charAt(0).toUpperCase() + filter.slice(1)}`))}</p>
        )}
        {state.kind === 'ok' && state.items.length > 0 && (
          <AdminTable items={state.items} onApprove={handleApprove} onReject={handleReject} />
        )}
      </div>
    </>
  );
}

function AdminTable({
  items,
  onApprove,
  onReject,
}: {
  items: SubdomainApplication[];
  onApprove: (id: string, name: string) => void;
  onReject: (id: string, name: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className='table-wrap'>
      <table className='table admin-table'>
        <thead>
          <tr>
            <th scope='col'>{t('admin.thName')}</th>
            <th scope='col'>{t('admin.thNs')}</th>
            <th scope='col'>{t('admin.thDs')}</th>
            <th scope='col'>{t('admin.thPurpose')}</th>
            <th scope='col'>{t('admin.thContact')}</th>
            <th scope='col'>{t('admin.thAuth')}</th>
            <th scope='col'>{t('admin.thCreated')}</th>
            <th scope='col'>{t('admin.thStatus')}</th>
            <th scope='col'>{t('admin.thActions')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((app) => (
            <tr key={app.id}>
              <td>
                <strong>{app.name}.gov.dn42</strong>
                <br />
                <span className='doc-desc'>{app.id}</span>
              </td>
              <td>
                <ul className='record-list'>
                  {app.ns.map((ns) => (
                    <li key={ns}>{ns}</li>
                  ))}
                </ul>
              </td>
              <td>
                {app.ds && app.ds.length > 0 ? (
                  <ul className='record-list'>
                    {app.ds.map((ds) => (
                      <li key={ds}>{ds}</li>
                    ))}
                  </ul>
                ) : (
                  <span className='text-muted'>—</span>
                )}
              </td>
              <td>{app.purpose}</td>
              <td>{app.contact}</td>
              <td>
                {app.auth ? (
                  <span className='text-muted'>
                    {app.auth.providerId}
                    <br />
                    {app.auth.sub}
                  </span>
                ) : (
                  <span className='text-muted'>—</span>
                )}
              </td>
              <td className='num'>{app.createdAt.slice(0, 19).replace('T', ' ')}</td>
              <td>
                <span className={`tag tag--${app.status === 'pending' ? 'plan' : app.status === 'approved' ? 'ok' : 'warn'}`}>
                  {t(`admin.status${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`)}
                </span>
                {app.reason && (
                  <>
                    <br />
                    <span className='doc-desc'>{app.reason}</span>
                  </>
                )}
              </td>
              <td>
                {app.status === 'pending' ? (
                  <div className='admin-actions'>
                    <button type='button' className='btn btn--primary btn--sm' onClick={() => void onApprove(app.id, app.name)}>
                      {t('admin.approve')}
                    </button>
                    <button type='button' className='btn btn--outline btn--sm' onClick={() => void onReject(app.id, app.name)}>
                      {t('admin.reject')}
                    </button>
                  </div>
                ) : (
                  <span className='text-muted'>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
