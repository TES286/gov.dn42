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
| `/admin` | 管理员审批 | 审核子域名注册申请（仅 ASN 4242420078） |
| `/legal` | 法律声明 | 网站性质、隐私与免责声明 |

## 后端 API

子域名注册、举报/意见提交与 OIDC 认证等在线服务的前端已按 [`docs/api.md`](docs/api.md) 中定义的接口
契约调用，默认指向同源 `/api/v1`，可通过环境变量覆盖：

```bash
VITE_API_BASE=https://api.gov.dn42/v1 pnpm build
```

后端尚未部署时，表单会以友好的提示优雅降级，不会抛出裸错误。

### 后端服务器

`server/server.ts` 提供生产准备级后端，数据持久化到 PostgreSQL。

- **开发模式**：`pnpm dev` 自动将 `/api/v1` 转发到后端（Vite 插件懒加载 `server.ts`），
  开发环境默认用 PGlite（零安装 WASM PostgreSQL），无需单独启动
- **独立运行**：`pnpm server`（默认监听 `:8787`）
  - 生产：`PG_CONNECTION_STRING=postgres://... pnpm server`
  - 开发：`PGLITE_PATH=/tmp/gov-dn42 pnpm server`

后端对 OIDC ID token 解码 payload 但不校验签名——仅供开发演示，
生产部署必须用 JWKS 校验签名。子域名采用 NS 委派：申请者提供 NS 记录，
审批通过后写入 `delegations` 表，bind9 DLZ 模块直接查询 PostgreSQL 提供响应。

部署（systemd + Caddy）见 [`deploy/README.md`](deploy/README.md)。
bind9 DLZ 集成见 [`dlz/README.md`](dlz/README.md)。

### OIDC 身份认证配置

子域名注册支持三个 DN42 社区 OIDC 提供商，采用常规 Authorization Code + client_secret 流。
`client_id` 在前端硬编码，`client_secret` 由后端环境变量配置：

```bash
# 后端环境变量（生产）
OIDC_CLIENT_SECRET_IEDON=your-secret \
OIDC_CLIENT_SECRET_G_LOAD=your-secret \
OIDC_CLIENT_SECRET_HEXPNET=your-secret \
pnpm server
```

管理员限定为 ASN `4242420078` 的所有者（OIDC 返回的 `dn42` 声明中 ASN 为
4242420078 的用户）。

## 部署

- 仓库内置 GitHub Pages 工作流（`.github/workflows/deploy.yml`），推送到
  `master` 即自动构建发布，构建时自动附加项目子路径 base。
- 部署至自定义域名（如 `gov.dn42`）时，使用根路径构建：`pnpm build`，
  并移除工作流中的 `--base` 参数。

## 目录结构

```
gov.dn42/
├── docs/api.md            # 后端 API 接口契约
├── deploy/                # 部署配置（systemd / Caddy / PostgreSQL init）
├── dlz/                   # bind9 DLZ 模块（从 pgsql 读取委派记录）
├── server/                # 后端服务器（PostgreSQL 生产准备级）
│   ├── server.ts          # HTTP 路由与业务逻辑
│   ├── db.ts              # 数据库抽象（pg / pglite 双后端）
│   └── schema.sql         # PostgreSQL schema
├── public/                # 静态资源（favicon 等）
├── src/
│   ├── components/        # 布局与品牌组件
│   ├── data/              # 栏目内容数据（双语结构）
│   ├── i18n/              # 国际化（Context + hooks + locales）
│   ├── lib/               # API 对接层、OIDC、工具函数
│   ├── pages/             # 路由页面组件
│   └── styles/global.css  # 全局设计系统
└── index.html
```

## 路线图

- [x] 后端：生产准备级后端（`server/server.ts`，PostgreSQL 持久化）
- [x] 部署：systemd unit + Caddyfile（`deploy/`）
- [x] DNS：bind9 DLZ 模块（`dlz/`，从 pgsql 读取委派记录）
- [x] 审核：管理员审批页面（`/admin`）+ ASN 4242420078 限定
- [x] 委派模式：子域名采用 NS 委派（DS 可选）
- [x] 界面：英文版（i18n）
- [ ] 生产：JWKS 校验 ID token 签名（当前仅解码 payload）
- [ ] 服务：Whois 信息查询
- [ ] 服务：网络资源纠纷调解在线申请

## 贡献

欢迎通过 Issue 与 Pull Request 参与共建。提交信息请使用约定式前缀
（`feat:` / `fix:` / `docs:` / `chore:`）。

## 许可与免责声明

代码以 [MIT 许可](LICENSE) 开源。

本网站为 DN42 网络社区的虚构项目，不构成任何现实法律服务、行政服务或
其他现实用途；与任何现实国家、地区或组织的政府机构无关。
