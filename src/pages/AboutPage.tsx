import { Link } from 'react-router-dom';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { departments } from '../data/departments';
import { usePageTitle } from '../lib/usePageTitle';

const HISTORY = [
  {
    year: '2026 年 10 月',
    title: '社区倡议',
    text: '社区成员围绕"去中心化网络需要怎样的公共治理"展开讨论，自治治理实验获得广泛响应。',
  },
  {
    year: '2026 年 10 月',
    title: '章程试行',
    text: '《政府组织章程（试行）》经社区评议后发布，明确政府为社区自治的虚构治理实验机构。',
  },
  {
    year: '2026 年 10 月',
    title: '机构组建',
    text: '六个常设机构组建完成，开始受理政策草案起草与公共服务规划工作。',
  },
  {
    year: '2026 年 10 月',
    title: '门户上线',
    text: '政府门户网站上线试运行，子域名注册等在线服务筹备开放。',
  },
];

const LEADERSHIP = [
  { post: '政府委员会主席', org: '政府委员会', status: '首届选举筹备中', tag: 'tag--warn' },
  { post: '各部门负责人', org: '各组成部门', status: '任命程序进行中', tag: 'tag--info' },
  { post: '监察委员', org: '资源与纠纷调解委员会', status: '待社区提名', tag: 'tag--plan' },
];

export default function AboutPage() {
  usePageTitle('政府概况');

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: '关于政府' }]} />
          <h1>政府概况</h1>
          <p className='page-head__sub'>了解 DN42 联合自治政府的定位、历史沿革、组织架构与领导机构。</p>
        </div>
      </div>

      <div className='container page-body'>
        <section className='about-section' aria-labelledby='about-position'>
          <h2 className='section-title' id='about-position'>
            定位与使命
          </h2>
          <p>
            DN42 联合自治政府（以下简称"政府"）是 DN42 网络社区成员自发组建的公共治理实验机构。政府不持有任何现实行政权力，其全部工作均在 DN42
            网络与开源社区框架内进行，旨在去中心化的虚拟网络环境中，探索轻量、透明、可参与的公共治理模式。
          </p>
          <p>
            政府的使命可以概括为三个关键词：<strong>互联</strong>
            ——促进网络互联互通与对等合作，降低新公民的接入门槛；<strong>开放</strong>
            ——坚持政务公开与开源共建，所有政策草案与站点代码向社区开放；<strong>稳定</strong>
            ——维护路由稳定与资源分配秩序，及时调解资源争议，营造良好的网络环境。
          </p>
        </section>

        <section className='about-section' aria-labelledby='about-history'>
          <h2 className='section-title' id='about-history'>
            历史沿革
          </h2>
          <ul className='timeline'>
            {HISTORY.map((item) => (
              <li key={item.year}>
                <time>{item.year}</time>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className='about-section' aria-labelledby='about-departments-title' id='departments'>
          <h2 className='section-title' id='about-departments-title'>
            组织架构
          </h2>
          <div className='card-grid card-grid--3'>
            {departments.map((dept) => (
              <div key={dept.name} className='card card--dept card--static'>
                <h3>{dept.name}</h3>
                <p>{dept.duty}</p>
              </div>
            ))}
          </div>
          <p className='text-muted'>
            如需联系具体部门，请参阅
            <Link to='/contact'>联系我们</Link>页面。
          </p>
        </section>

        <section className='about-section' aria-labelledby='about-leadership'>
          <h2 className='section-title' id='about-leadership'>
            领导机构
          </h2>
          <div className='table-wrap'>
            <table className='table'>
              <caption>首届领导机构人员产生方式与当前进度</caption>
              <thead>
                <tr>
                  <th scope='col'>职务</th>
                  <th scope='col'>所属机构</th>
                  <th scope='col'>当前状态</th>
                </tr>
              </thead>
              <tbody>
                {LEADERSHIP.map((row) => (
                  <tr key={row.post}>
                    <td>{row.post}</td>
                    <td>{row.org}</td>
                    <td>
                      <span className={`tag ${row.tag}`}>{row.status}</span>
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
