import { Link } from 'react-router-dom';

export interface Crumb {
  label: string;
  to?: string;
}

/** 面包屑导航（首项固定为首页） */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className='breadcrumb' aria-label='面包屑导航'>
      <ol>
        <li>
          <Link to='/'>首页</Link>
        </li>
        {items.map((item) => (
          <li key={item.label}>{item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current='page'>{item.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
