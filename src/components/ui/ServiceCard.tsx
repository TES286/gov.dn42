import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { STATUS_META, type ServiceItem } from '../../data/services';

/** 公民服务卡片：可办理/指引状态可点击跳转，建设中仅展示 */
export function ServiceCard({ service }: { service: ServiceItem }) {
  const { t, pick } = useI18n();
  const meta = STATUS_META[service.status];
  const statusLabel = t(`services.status${meta.labelKey}`);
  const body = (
    <>
      <span className={`tag ${meta.className}`}>{statusLabel}</span>
      <h3>{pick(service.name)}</h3>
      <p>{pick(service.desc)}</p>
      {service.status !== 'planned' && <span className='card__more'>{t('services.learnMore')}</span>}
    </>
  );

  if (service.to) {
    return (
      <Link className='card' to={service.to}>
        {body}
      </Link>
    );
  }
  if (service.href) {
    return (
      <a className='card' href={service.href} target='_blank' rel='noreferrer'>
        {body}
      </a>
    );
  }
  return <div className='card'>{body}</div>;
}
