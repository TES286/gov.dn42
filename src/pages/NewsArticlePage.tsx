import { useParams } from 'react-router-dom'
import { Breadcrumb } from '../components/layout/Breadcrumb'
import { usePageTitle } from '../lib/usePageTitle'

export default function NewsArticlePage() {
  const { slug } = useParams()
  usePageTitle('公告详情')

  return (
    <>
      <div className="page-head">
        <div className="container">
          <Breadcrumb items={[{ label: '新闻公告', to: '/news' }, { label: '公告详情' }]} />
          <h1>公告详情</h1>
        </div>
      </div>
      <div className="container placeholder">
        <h2>栏目建设中</h2>
        <p>公告 {slug} 的正文内容正在整理。</p>
      </div>
    </>
  )
}
