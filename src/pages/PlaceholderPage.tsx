import { Breadcrumb, type Crumb } from '../components/layout/Breadcrumb'
import { usePageTitle } from '../lib/usePageTitle'

interface PlaceholderPageProps {
  title: string
  crumbs?: Crumb[]
  note?: string
}

/** 框架阶段占位页：后续按栏目逐一充实 */
export function PlaceholderPage({ title, crumbs, note }: PlaceholderPageProps) {
  usePageTitle(title)

  return (
    <>
      <div className="page-head">
        <div className="container">
          {crumbs && <Breadcrumb items={crumbs} />}
          <h1>{title}</h1>
        </div>
      </div>
      <div className="container placeholder">
        <h2>栏目建设中</h2>
        <p>{note ?? '本栏目内容正在整理，即将上线。'}</p>
      </div>
    </>
  )
}
