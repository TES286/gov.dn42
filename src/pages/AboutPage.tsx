import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { departments } from '../data/departments';
import { usePageTitle } from '../lib/usePageTitle';

const HISTORY: { year: string; title: { zh: string; en: string }; text: { zh: string; en: string } }[] = [
  {
    year: '2026 年 10 月',
    title: { zh: '社区倡议', en: 'Community initiative' },
    text: {
      zh: '社区成员围绕“去中心化网络需要怎样的公共治理”展开讨论，自治治理实验获得广泛响应。',
      en: 'Community members discussed “what public governance a decentralised network needs”; the self-governance experiment received broad support.',
    },
  },
  {
    year: '2026 年 10 月',
    title: { zh: '章程试行', en: 'Constitution on trial' },
    text: {
      zh: '《政府组织章程（试行）》经社区评议后发布，明确政府为社区自治的虚构治理实验机构。',
      en: 'The Constitution (Trial) was published after community review, defining the Government as a community self-governance experiment.',
    },
  },
  {
    year: '2026 年 10 月',
    title: { zh: '机构组建', en: 'Bodies established' },
    text: {
      zh: '六个常设机构组建完成，开始受理政策草案起草与公共服务规划工作。',
      en: 'Six permanent bodies were established and began policy drafting and public service planning.',
    },
  },
  {
    year: '2026 年 10 月',
    title: { zh: '门户上线', en: 'Portal launched' },
    text: {
      zh: '政府门户网站上线试运行，子域名注册等在线服务筹备开放。',
      en: 'The portal entered trial operation; subdomain registration and other online services are being prepared.',
    },
  },
];

const LEADERSHIP: { post: { zh: string; en: string }; org: { zh: string; en: string }; status: { zh: string; en: string }; tag: string }[] = [
  {
    post: { zh: '政府委员会主席', en: 'Chair of the Government Committee' },
    org: { zh: '政府委员会', en: 'Government Committee' },
    status: { zh: '首届选举筹备中', en: 'Inaugural election in preparation' },
    tag: 'tag--warn',
  },
  {
    post: { zh: '各部门负责人', en: 'Heads of departments' },
    org: { zh: '各组成部门', en: 'Constituent departments' },
    status: { zh: '任命程序进行中', en: 'Appointment in progress' },
    tag: 'tag--info',
  },
  {
    post: { zh: '监察委员', en: 'Oversight members' },
    org: { zh: '资源与纠纷调解委员会', en: 'Resources and Dispute Mediation Committee' },
    status: { zh: '待社区提名', en: 'Awaiting community nomination' },
    tag: 'tag--plan',
  },
];

export default function AboutPage() {
  const { t, pick } = useI18n();
  usePageTitle(t('about.title'));

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: t('about.title') }]} />
          <h1>{t('about.title')}</h1>
          <p className='page-head__sub'>{t('about.sub')}</p>
        </div>
      </div>

      <div className='container page-body'>
        <section className='about-section' aria-labelledby='about-position'>
          <h2 className='section-title' id='about-position'>
            {t('about.positionTitle')}
          </h2>
          <p>{t('about.positionP1')}</p>
          <p>{t('about.positionP2')}</p>
        </section>

        <section className='about-section' aria-labelledby='about-history'>
          <h2 className='section-title' id='about-history'>
            {t('about.historyTitle')}
          </h2>
          <ul className='timeline'>
            {HISTORY.map((item) => (
              <li key={pick(item.title)}>
                <time>{item.year}</time>
                <strong>{pick(item.title)}</strong>
                <p>{pick(item.text)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className='about-section' aria-labelledby='about-departments-title' id='departments'>
          <h2 className='section-title' id='about-departments-title'>
            {t('about.deptsTitle')}
          </h2>
          <div className='card-grid card-grid--3'>
            {departments.map((dept) => (
              <div key={pick(dept.name)} className='card card--dept card--static'>
                <h3>{pick(dept.name)}</h3>
                <p>{pick(dept.duty)}</p>
              </div>
            ))}
          </div>
          <p className='text-muted'>
            {t('about.deptsContactRefPre')}
            <Link to='/contact'>{t('nav.contact')}</Link>
            {t('about.deptsContactRefPost')}
          </p>
        </section>

        <section className='about-section' aria-labelledby='about-leadership'>
          <h2 className='section-title' id='about-leadership'>
            {t('about.leadershipTitle')}
          </h2>
          <div className='table-wrap'>
            <table className='table'>
              <caption>{t('about.tableCaption')}</caption>
              <thead>
                <tr>
                  <th scope='col'>{t('about.thPost')}</th>
                  <th scope='col'>{t('about.thOrg')}</th>
                  <th scope='col'>{t('about.thStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {LEADERSHIP.map((row) => (
                  <tr key={pick(row.post)}>
                    <td>{pick(row.post)}</td>
                    <td>{pick(row.org)}</td>
                    <td>
                      <span className={`tag ${row.tag}`}>{pick(row.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
