import { Link } from 'react-router-dom';
import { usePageTitle } from '../lib/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('页面未找到');

  return (
    <div className='container not-found'>
      <div className='not-found__code' aria-hidden='true'>
        4<span>0</span>4
      </div>
      <h1>页面未找到</h1>
      <p>您访问的页面不存在或已被迁移。</p>
      <div className='not-found__actions'>
        <Link className='btn btn--primary' to='/'>
          返回首页
        </Link>
        <Link className='btn btn--outline' to='/services'>
          前往公民服务
        </Link>
      </div>
    </div>
  );
}
