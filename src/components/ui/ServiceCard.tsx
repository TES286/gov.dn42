import { Link } from 'react-router-dom'
import { STATUS_META, type ServiceItem } from '../../data/services'

/** 公民服务卡片：可办理/指引状态可点击跳转，建设中仅展示 */
export function ServiceCard({ service }: { service: ServiceItem }) {
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
