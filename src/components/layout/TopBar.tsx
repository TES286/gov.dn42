import { Link } from 'react-router-dom'

/** 顶部功能条 */
export function TopBar() {
  return (
    <div className="topbar">
      <div className="container topbar__inner">
        <span className="topbar__note">
          United Autonomous Government of DN42 · DN42 联合自治政府
        </span>
        <div className="topbar__links">
          <Link to="/legal">法律声明</Link>
          <Link to="/contact">联系我们</Link>
          <span className="topbar__lang" title="多语言支持规划中">
            中文
          </span>
        </div>
      </div>
    </div>
  )
}
