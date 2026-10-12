import { Link } from 'react-router-dom'
import { departments } from '../data/departments'
import { newsItems } from '../data/news'
import { services, STATUS_META, type ServiceItem } from '../data/services'
import { usePageTitle } from '../lib/usePageTitle'

function ServiceCard({ service }: { service: ServiceItem }) {
  const meta = STATUS_META[service.status]
  const body = (
    <>
      <span className={`tag ${meta.className}`}>{meta.label}</span>
      <h3>{service.name}</h3>
      <p>{service.desc}</p>
      {service.status !== 'planned' && <span className="card__more">了解更多 →</span>}
    </>
  )

  if (service.to) {
    return (
      <Link className="card" to={service.to}>
        {body}
      </Link>
    )
  }
  if (service.href) {
    return (
      <a className="card" href={service.href} target="_blank" rel="noreferrer">
        {body}
      </a>
    )
  }
  return <div className="card">{body}</div>
}

function NewsPreview() {
  return (
    <div className="news-list">
      {newsItems.slice(0, 3).map((item) => {
        const content = (
          <>
            <span className="news-item__date">{item.date}</span>
            <span>
              <span className="news-item__title">{item.title}</span>
              <span className="news-item__summary">{item.summary}</span>
            </span>
            <span className="news-item__org">{item.org}</span>
          </>
        )
        return item.published ? (
          <Link key={item.slug} className="news-item" to={`/news/${item.slug}`}>
            {content}
          </Link>
        ) : (
          <div key={item.slug} className="news-item">
            {content}
          </div>
        )
      })}
    </div>
  )
}

export default function HomePage() {
  usePageTitle()

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <p className="hero__kicker">DN42 UNITED AUTONOMOUS GOVERNMENT</p>
          <h1>欢迎访问 DN42 联合自治政府门户网站</h1>
          <p className="hero__lead">
            面向全体 DN42 网络公民，提供政务信息公开、政策文件查询与在线公共服务，与您携手共建互联、开放、稳定的网络空间。
          </p>
          <div className="hero__actions">
            <Link className="btn btn--gold" to="/services/subdomain">
              办理子域名注册
            </Link>
            <Link className="btn btn--ghost" to="/about">
              了解政府组织
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="home-services">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title" id="home-services">
              公民服务
              <span className="section-title__sub">便捷、透明的在线政务服务</span>
            </h2>
            <Link className="section-more" to="/services">
              全部服务 →
            </Link>
          </div>
          <div className="card-grid">
            {services.slice(0, 4).map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="home-news">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title" id="home-news">
              新闻公告
              <span className="section-title__sub">政府工作动态与政策发布</span>
            </h2>
            <Link className="section-more" to="/news">
              更多公告 →
            </Link>
          </div>
          <NewsPreview />
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="home-departments">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title" id="home-departments">
              政府组成
              <span className="section-title__sub">分工明确的常设机构体系</span>
            </h2>
            <Link className="section-more" to="/about#departments">
              组织架构 →
            </Link>
          </div>
          <div className="card-grid card-grid--3">
            {departments.map((dept) => (
              <Link key={dept.name} className="card card--dept" to="/about#departments">
                <h3>{dept.name}</h3>
                <p>{dept.duty}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
