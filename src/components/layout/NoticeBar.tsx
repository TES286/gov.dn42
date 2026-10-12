/** 首页试运行公告条 */
export function NoticeBar() {
  return (
    <div className="notice-bar" role="note">
      <div className="container">
        <strong>公告</strong>
        <span>
          本门户网站于 2026 年 10 月上线试运行，在线服务正陆续开放，欢迎通过
          <a href="https://github.com/TES286/gov.dn42" target="_blank" rel="noreferrer">
            源代码仓库
          </a>
          提出意见与建议。
        </span>
      </div>
    </div>
  )
}
