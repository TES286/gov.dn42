import { Link } from 'react-router-dom'
import { Breadcrumb } from '../components/layout/Breadcrumb'
import { ServiceCard } from '../components/ui/ServiceCard'
import { services } from '../data/services'
import { usePageTitle } from '../lib/usePageTitle'

export default function ServicesPage() {
  usePageTitle('公民服务')

  return (
    <>
      <div className="page-head">
        <div className="container">
          <Breadcrumb items={[{ label: '公民服务' }]} />
          <h1>公民服务</h1>
          <p className="page-head__sub">
            面向 DN42 网络公民的在线政务服务与办事指引总览。
          </p>
        </div>
      </div>

      <div className="container page-body">
        <div className="callout callout--gold" role="note">
          <p>
            <strong>服务状态说明：</strong>
            在线服务处于试运行阶段，标注"可办理"的服务已开放申请；标注"办事指引"的服务提供标准流程参考；
            标注"建设中"的服务正在开发，开放时间将另行公告。
          </p>
        </div>

        <div className="card-grid card-grid--3" aria-label="公民服务目录">
          {services.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </div>

        <div className="callout callout--spaced">
          <p>
            <strong>办事须知：</strong>
            各项在线服务均免费提供，不收取任何形式的费用。提交申请前，请先阅读
            <Link to="/policy">政务公开</Link>栏目中的相关管理办法；对服务流程有疑问的，可查阅
            <Link to="/faq">常见问题</Link>或通过<Link to="/contact">联系我们</Link>页面咨询。
          </p>
        </div>
      </div>
    </>
  )
}
