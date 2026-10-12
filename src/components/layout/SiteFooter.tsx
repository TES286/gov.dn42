import { Link } from 'react-router-dom'
import { Crest } from '../brand/Crest'

/** 页脚：栏目导航 + 相关站点 + 版权与虚构声明 */
export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <div className="site-footer__brand">
            <Crest size={34} />
            <span>
              gov<span className="tld">.dn42</span>
            </span>
          </div>
          <p className="site-footer__desc">
            DN42 联合自治政府官方门户网站，面向全体网络公民提供政务信息公开与在线公共服务。
          </p>
        </div>

        <nav aria-label="页脚导航：网站栏目">
          <h4>网站栏目</h4>
          <ul>
            <li>
              <Link to="/about">关于政府</Link>
            </li>
            <li>
              <Link to="/news">新闻公告</Link>
            </li>
            <li>
              <Link to="/services">公民服务</Link>
            </li>
            <li>
              <Link to="/policy">政务公开</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="页脚导航：公共服务">
          <h4>公共服务</h4>
          <ul>
            <li>
              <Link to="/services/subdomain">子域名注册</Link>
            </li>
            <li>
              <Link to="/faq">常见问题</Link>
            </li>
            <li>
              <Link to="/contact">联系我们</Link>
            </li>
            <li>
              <Link to="/legal">法律声明</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="页脚导航：相关站点">
          <h4>相关站点</h4>
          <ul>
            <li>
              <a href="https://dn42.dev" target="_blank" rel="noreferrer">
                DN42 官方 Wiki
              </a>
            </li>
            <li>
              <a href="https://git.dn42.dev/dn42/registry" target="_blank" rel="noreferrer">
                DN42 Registry
              </a>
            </li>
            <li>
              <a href="https://github.com/TES286/gov.dn42" target="_blank" rel="noreferrer">
                源代码仓库
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <div className="container">
          <p>© {year} DN42 联合自治政府门户网站 · 保留所有权利</p>
          <p className="site-footer__fiction">
            本网站为 DN42 网络社区的虚构项目，与任何现实国家、地区或组织的政府机构无关。
          </p>
        </div>
      </div>
    </footer>
  )
}
