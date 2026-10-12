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
- 无任何运行时第三方 UI 依赖；样式为手写设计系统，遵循 [GOV.UK Design System](https://design-system.service.gov.uk/) 设计规范
- 无后端。在线服务前端已按 [`docs/api.md`](docs/api.md) 契约预留接口层
- 内置轻量 i18n（零依赖 Context + hooks），提供中文与英文双语
- 子域名注册接入 DN42 社区 OIDC 身份认证（Authorization Code + PKCE）

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
| `/services/subdomain` | 子域名注册 | 在线申请表单（需 OIDC 身份认证，前端就绪，等待后端） |
| `/auth/callback` | OIDC 回调 | 处理身份认证回调 |
| `/policy` | 政务公开 | 政策法规与信息公开 |
| `/faq` | 常见问题 | 公民常见疑问 |
| `/contact` | 联系我们 | 联系渠道 |
| `/report` | 举报信箱 | 举报信投递入口（后端记录备案） |
| `/feedback` | 意见箱 | 意见反馈入口（后端记录备案） |
| `/admin` | 管理员审批 | 审核子域名注册申请（mock 阶段不鉴权） |
| `/legal` | 法律声明 | 网站性质、隐私与免责声明 |

## 后端 API 预留

子域名注册、举报/意见提交与 OIDC 认证等在线服务的前端已按 [`docs/api.md`](docs/api.md) 中定义的接口
契约调用，默认指向同源 `/api/v1`，可通过环境变量覆盖：

```bash
VITE_API_BASE=https://api.gov.dn42/v1 pnpm build
```

后端尚未部署时，表单会以友好的提示优雅降级，不会抛出裸错误。

### Mock 后端（开发用）

仓库内置一份零依赖的 demo 后端（`server/mockApi.ts`），实现全部接口（1–7）+ OIDC 回调。
数据存储在内存，重启即重置。

- **开发模式**：`pnpm dev` 自动将 `/api/v1` 转发到 mock handler（见 `vite.config.ts` 的 `mockApi()` 插件），
  无需单独启动
- **独立运行**：`node --import tsx server/mockApi.ts`（默认监听 `:8787`，`MOCK_PORT` 可配）

mock 后端对 OIDC ID token 仅解码 payload、不做签名校验——仅供开发演示，
生产部署必须用 JWKS 校验签名。子域名采用 NS 委派：申请者提供 NS 记录，
审批通过后由管理员向 DN42 Registry 提交 zone delegation。

### OIDC 身份认证配置

子域名注册支持三个 DN42 社区 OIDC 提供商，`client_id` 通过环境变量配置：

```bash
VITE_OIDC_CLIENT_ID_IEDON=your-client-id \
VITE_OIDC_CLIENT_ID_G_LOAD=your-client-id \
VITE_OIDC_CLIENT_ID_HEXPNET=your-client-id \
pnpm build
```

未配置 `client_id` 的提供商，其登录按钮在点击时会给出配置提示。

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

- [x] 后端：mock 后端（`server/mockApi.ts`，开发用）
- [x] 审核流：管理员审批页面（`/admin`）+ 管理员端点
- [x] 委派模式：子域名采用 NS 委派（DS 可选）
- [ ] 后端：实现生产级后端 API（契约见 `docs/api.md`）
- [ ] 服务：Whois 信息查询
- [ ] 服务：网络资源纠纷调解在线申请
- [x] 界面：英文版（i18n）

## 贡献

欢迎通过 Issue 与 Pull Request 参与共建。提交信息请使用约定式前缀
（`feat:` / `fix:` / `docs:` / `chore:`）。

## 许可与免责声明

代码以 [MIT 许可](LICENSE) 开源。

本网站为 DN42 网络社区的虚构项目，不构成任何现实法律服务、行政服务或
其他现实用途；与任何现实国家、地区或组织的政府机构无关。
