import { Link } from 'react-router-dom'
import { Breadcrumb } from '../components/layout/Breadcrumb'
import { newsItems } from '../data/news'
import { usePageTitle } from '../lib/usePageTitle'

export default function NewsPage() {
  usePageTitle('新闻公告')

  return (
    <>
      <div className="page-head">
        <div className="container">
          <Breadcrumb items={[{ label: '新闻公告' }]} />
          <h1>新闻公告</h1>
          <p className="page-head__sub">政府工作动态、政策发布与社区通知。</p>
        </div>
      </div>

      <div className="container page-body">
        <div className="news-list">
          {newsItems.map((item) => {
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
        <p className="text-muted">更早的历史公告正在整理归档，将陆续发布。</p>
      </div>
    </>
  )
}
