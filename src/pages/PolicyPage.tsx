import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { policies, POLICY_STATUS_META } from '../data/policies';
import { usePageTitle } from '../lib/usePageTitle';

export default function PolicyPage() {
  const { t, pick } = useI18n();
  usePageTitle(t('policy.title'));

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('policy.title') }]} />
          <h1>{t('policy.title')}</h1>
          <p className='page-head__sub'>{t('policy.sub')}</p>
        </div>
      </div>

      <div className='container page-body'>
        <div className='callout' role='note'>
          <p>
            <strong>{t('policy.principleTitle')}</strong>
            {t('policy.principleBody')}
          </p>
        </div>

        <div className='table-wrap'>
          <table className='table'>
            <caption>{t('policy.tableCaption')}</caption>
            <thead>
              <tr>
                <th scope='col'>{t('policy.thTitle')}</th>
                <th scope='col'>{t('policy.thOrg')}</th>
                <th scope='col'>{t('policy.thDate')}</th>
                <th scope='col'>{t('policy.thStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => {
                const meta = POLICY_STATUS_META[policy.status];
                return (
                  <tr key={pick(policy.title)}>
                    <td>
                      <strong>{pick(policy.title)}</strong>
                      <br />
                      <span className='doc-desc'>{pick(policy.summary)}</span>
                    </td>
                    <td>{pick(policy.org)}</td>
                    <td className='num'>{policy.date}</td>
                    <td>
                      <span className={`tag ${meta.className}`}>{t(`policy.status${meta.labelKey}`)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className='callout callout--gold callout--spaced'>
          <p>
            <strong>{t('policy.consultationTitle')}</strong>
            {t('policy.consultationBody1')}
            <Link to='/news/subdomain-measures-draft'>{t('policy.consultationLink')}</Link>
            {t('policy.consultationBody2')}
          </p>
        </div>

        <p className='text-muted'>{t('policy.note')}</p>
      </div>
    </>
  );
}
