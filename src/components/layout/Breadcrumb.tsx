import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';

export interface Crumb {
  /** 已本地化的标签文本 */
  label: string;
  to?: string;
}

/** 面包屑导航（首项固定为首页） */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const { t } = useI18n();

  return (
    <nav className='breadcrumb' aria-label={t('common.home')}>
      <ol>
        <li>
          <Link to='/'>{t('common.home')}</Link>
        </li>
        {items.map((item) => (
          <li key={item.label}>{item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current='page'>{item.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
