import { Link, useParams } from 'react-router-dom';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { newsItems } from '../data/news';
import { usePageTitle } from '../lib/usePageTitle';

export default function NewsArticlePage() {
  const { slug } = useParams();
  const item = newsItems.find((entry) => entry.slug === slug);
  usePageTitle(item?.title ?? '公告详情');

  if (!item || !item.published) {
    return (
      <div className='container not-found'>
        <div className='not-found__code' aria-hidden='true'>
          <span>4</span>0<span>4</span>
        </div>
        <h1>公告不存在</h1>
        <p>您访问的公告不存在、已撤销或尚未发布。</p>
        <div className='not-found__actions'>
          <Link className='btn btn--primary' to='/news'>
            返回公告列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: '新闻公告', to: '/news' }, { label: '公告详情' }]} />
          <h1>新闻公告</h1>
        </div>
      </div>

      <div className='container page-body'>
        <article className='article'>
          <div className='article__meta'>
            <span>发布日期：{item.date}</span>
            <span>发布机构：{item.org}</span>
          </div>
          <h2>{item.title}</h2>
          {item.body?.map((paragraph) => (
            <p key={paragraph.slice(0, 16)}>{paragraph}</p>
          ))}
          <div className='article__footer'>
            <Link to='/news'>← 返回公告列表</Link>
            {item.slug === 'subdomain-measures-draft' && <Link to='/policy'>查看政务公开栏目 →</Link>}
          </div>
        </article>
      </div>
    </>
  );
}
