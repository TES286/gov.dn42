import { Link } from 'react-router-dom';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { usePageTitle } from '../lib/usePageTitle';

export default function LegalPage() {
  usePageTitle('法律声明');

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: '法律声明' }]} />
          <h1>法律声明</h1>
          <p className='page-head__sub'>网站性质、知识产权、隐私保护与免责事项。</p>
        </div>
      </div>

      <div className='container page-body'>
        <section className='about-section' aria-labelledby='legal-nature'>
          <h2 className='section-title' id='legal-nature'>
            网站性质与声明
          </h2>
          <p>
            本网站（gov.dn42）是 DN42
            网络社区成员建设的虚构"政府"门户网站，属于社区趣味项目与自治治理实验，不代表、不代理任何现实国家、地区或国际组织的政府机构。站内出现的"机构""部门""公文""公告"等表述均为虚构设定，仅服务于项目情境。
            DN42 本身为社区自治的实验性虚拟网络，不存在官方管理机构。
          </p>
        </section>

        <section className='about-section' aria-labelledby='legal-ip'>
          <h2 className='section-title' id='legal-ip'>
            知识产权
          </h2>
          <p>
            本网站源代码以
            {/*<a
              href="https://github.com/TES286/gov.dn42/blob/master/LICENSE"
              target="_blank"
              rel="noreferrer"
            >*/}
            MIT 许可证
            {/*</a>*/}
            开源，欢迎在许可范围内使用与修改；站点徽标与文案除另有说明外，依同一许可提供。文中提及的 DN42、hackint
            等第三方名称仅作说明用途，相关权益归其各自所有者。
          </p>
        </section>

        <section className='about-section' aria-labelledby='legal-privacy'>
          <h2 className='section-title' id='legal-privacy'>
            隐私保护
          </h2>
          <p>
            本网站为纯静态站点，不收集、不存储、不分析任何访问者的个人数据。子域名注册服务上线后，申请人提供的联系邮箱仅用于申请事项的沟通与审核结果通知，不会用于其他目的，亦不会提供给第三方。
          </p>
        </section>

        <section className='about-section' aria-labelledby='legal-disclaimer'>
          <h2 className='section-title' id='legal-disclaimer'>
            免责声明
          </h2>
          <p>
            本网站内容不构成任何现实的法律、行政或商业建议。对站点链接至的外部站点（包括 DN42 官方 Wiki、Registry
            等）的内容，本网站不承担任何责任。如您认为本网站内容侵害了您的合法权益，请通过
            <Link to='/contact'>联系我们</Link>
            页面反映，我们将在确认后及时处理。
          </p>
        </section>

        <section className='about-section' aria-labelledby='legal-effective'>
          <h2 className='section-title' id='legal-effective'>
            附则
          </h2>
          <p>本声明自 2026 年 10 月 10 日起施行。如有修订，将在本页面公告并注明生效日期。</p>
        </section>
      </div>
    </>
  );
}
