import { Link } from 'react-router-dom'
import { Breadcrumb } from '../components/layout/Breadcrumb'
import { policies, POLICY_STATUS_META } from '../data/policies'
import { usePageTitle } from '../lib/usePageTitle'

export default function PolicyPage() {
  usePageTitle('政务公开')

  return (
    <>
      <div className="page-head">
        <div className="container">
          <Breadcrumb items={[{ label: '政务公开' }]} />
          <h1>政务公开</h1>
          <p className="page-head__sub">
            政府政策法规、规章草案与信息公开目录，全部文本向社区开放。
          </p>
        </div>
      </div>

      <div className="container page-body">
        <div className="callout" role="note">
          <p>
            <strong>公开原则：</strong>
            依据《政府信息公开办法》，除涉及公民隐私的事项外，政府政策文件一律公开，
            起草过程中的草案同步公开征求意见。公民可以随时查阅并提出修改建议。
          </p>
        </div>

        <div className="table-wrap">
          <table className="table">
            <caption>政策文件目录（按发布日期排序）</caption>
            <thead>
              <tr>
                <th scope="col">文件名称</th>
                <th scope="col">发布机构</th>
                <th scope="col">发布日期</th>
                <th scope="col">状态</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => {
                const meta = POLICY_STATUS_META[policy.status]
                return (
                  <tr key={policy.title}>
                    <td>
                      <strong>{policy.title}</strong>
                      <br />
                      <span className="doc-desc">{policy.summary}</span>
                    </td>
                    <td>{policy.org}</td>
                    <td className="num">{policy.date}</td>
                    <td>
                      <span className={`tag ${meta.className}`}>{meta.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="callout callout--gold callout--spaced">
          <p>
            <strong>正在征求意见：</strong>
            《子域名分配管理办法（试行）》面向全体公民公开征求意见，截止 2026 年 10 月 31 日。
            欢迎查阅
            <Link to="/news/subdomain-measures-draft">公告正文</Link>
            并通过源代码仓库反馈意见。
          </p>
        </div>

        <p className="text-muted">
          说明：以上文件全文文本正在整理，正式文本将随试行版一并发布；政策文件均为社区共创的虚构内容。
        </p>
      </div>
    </>
  )
}
