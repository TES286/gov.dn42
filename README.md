# gov.dn42 — DN42 联合自治政府门户网站

> 一个纯属玩笑性质的虚构“政府门户网站”。
> gov.dn42 并非任何现实国家或地区的政府机构，而是 DN42 网络社区成员发起的
> 自治治理实验与趣味项目。认真你就输了——但界面，我们是认真的。

## 项目定位

本仓库承载“DN42 联合自治政府”的官方门户网站：一个外观严肃、五脏俱全的
静态站点，包含一个“政府官网”应当拥有的全部栏目，并提供在线“公民服务”
（目前为子域名注册的完整前端，后端 API 预留待实现）。

## 技术栈

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [react-router-dom](https://reactrouter.com/)：单页应用（SPA）多路由，构建产物为纯静态文件
- 无任何运行时第三方 UI 依赖；样式为手写设计系统（深蓝 + 鎏金政务风）
- 无后端。在线服务前端已按 [`docs/api.md`](docs/api.md) 契约预留接口层

## 快速开始

```bash
pnpm install    # 安装依赖
pnpm dev        # 本地开发（默认 http://localhost:5173）
pnpm build      # 构建静态站点至 dist/
pnpm preview    # 本地预览构建产物（默认 http://localhost:4173）
pnpm lint       # ESLint 代码检查
```

## 页面结构

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 门户首页 | 政务公告、快捷服务入口、政府组成 |
| `/about` | 政府概况 | 定位、历史沿革、组织架构、领导机构 |
| `/news` | 新闻公告 | 通知公告列表 |
| `/news/:slug` | 公告详情 | 公告正文页 |
| `/services` | 公民服务 | 在线服务总览 |
| `/services/subdomain` | 子域名注册 | 在线申请表单（前端就绪，等待后端） |
| `/policy` | 政务公开 | 政策法规与信息公开 |
| `/faq` | 常见问题 | 公民常见疑问 |
| `/contact` | 联系我们 | 联系渠道 |
| `/legal` | 法律声明 | 网站性质、隐私与免责声明 |

## 后端 API 预留

子域名注册等在线服务的前端已按 [`docs/api.md`](docs/api.md) 中定义的接口
契约调用，默认指向同源 `/api/v1`，可通过环境变量覆盖：

```bash
VITE_API_BASE=https://api.gov.dn42/v1 pnpm build
```

后端尚未部署时，表单会以友好的提示优雅降级，不会抛出裸错误。

## 部署

- 仓库内置 GitHub Pages 工作流（`.github/workflows/deploy.yml`），推送到
  `master` 即自动构建发布，构建时自动附加项目子路径 base。
- 部署至自定义域名（如 `gov.dn42`）时，使用根路径构建：`pnpm build`，
  并移除工作流中的 `--base` 参数。

## 目录结构

```
gov.dn42/
├── docs/api.md            # 后端 API 接口契约
├── public/                # 静态资源（favicon 等）
├── src/
│   ├── components/        # 布局与品牌组件（导航、页脚、徽标等）
│   ├── data/              # 栏目内容数据（新闻、部门、政策、FAQ）
│   ├── lib/               # API 对接层与工具函数
│   ├── pages/             # 路由页面组件
│   └── styles/global.css  # 全局设计系统
└── index.html
```

## 路线图

- [ ] 后端：实现子域名注册 API（契约见 `docs/api.md`，进展见 Issues）
- [ ] 服务：Whois 信息查询
- [ ] 服务：网络资源纠纷调解在线申请
- [ ] 界面：英文版（i18n）

## 贡献

欢迎通过 Issue 与 Pull Request 参与共建。提交信息请使用约定式前缀
（`feat:` / `fix:` / `docs:` / `chore:`）。

## 许可与免责声明

代码以 [MIT 许可](LICENSE) 开源。

本网站为 DN42 网络社区的虚构项目，不构成任何现实法律服务、行政服务或
其他现实用途；与任何现实国家、地区或组织的政府机构无关。
