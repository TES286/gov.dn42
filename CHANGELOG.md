# 更新日志

本项目的所有显著变更将记录在本文件中。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- 门户网站整体框架：布局（顶部功能条 / 站头导航 / 公告条 / 页脚）、全站路由与 404 页面
- 栏目页面：门户首页、政府概况、新闻公告（列表与详情）、公民服务、政务公开、常见问题、联系我们、法律声明
- 子域名注册在线申请前端：办理流程说明、申请表单（客户端校验、可用性查询、受理回执）与优雅降级
- 后端 API 接口契约（`docs/api.md`）与统一对接层（`src/lib/api.ts`，`VITE_API_BASE` 可配置）
- 全站设计系统：政府徽标、响应式与打印样式
- GitHub Pages 自动部署工作流、robots.txt 与 sitemap.xml
- 举报信箱（`/report`）与意见箱（`/feedback`）：统一提交至 `POST /api/v1/submissions`，后端记录留档（默认 `/dev/null`）
- 国际化（i18n）基础设施：零依赖 Context + hooks，提供中文与英文两套 locale，语言切换持久化
- 子域名注册接入 OIDC 身份认证（Authorization Code + PKCE）：支持 iedon / g-load / hexpnet 三个 DN42 社区提供商，回调页消费 PKCE 会话并交由后端换 token
- Mock 后端（`server/mockApi.ts`）：零依赖（仅 `node:http`）实现全部接口 1–7 + OIDC 回调；开发模式作为 Vite 插件自动挂载 `/api/v1`
- 管理员审批页面（`/admin`）：表格列出全部申请，支持状态过滤与通过/驳回；管理员端点（`GET /admin/subdomains`、`POST /admin/subdomains/:id/{approve,reject}`）
- 子域名 NS/DS 委派模式：申请者提供 NS 记录（至少 2 个），DS 可选（DNSSEC）；审批通过后由管理员向 DN42 Registry 提交 zone delegation

### Changed

- 技术栈自 create-vite 默认模板迁移为门户站点结构（React 19 + Vite 8 + react-router-dom）
- 全站视觉重写：采用 [GOV.UK Design System](https://design-system.service.gov.uk/) 设计规范（黑色页头/页脚、绿色主按钮、黄色焦点、阶段横幅、直角边框），替换原"政务深蓝金"配色
- 阶段横幅（Phase Banner）改为全站展示，对齐 GOV.UK phase-banner 组件
- 全站数据文件（部门 / 新闻 / 政策 / FAQ / 服务）重构为 `{ zh, en }` 双语结构
- 子域名注册表单新增身份认证门控：未认证时隐藏表单，展示 OIDC 登录入口
- 子域名表单：IPv4/IPv6 输入框替换为 NS 记录 textarea（必填，至少 2 条）+ DS 记录 textarea（可选，DNSSEC）
- 子域名后缀由 `.dn42` 改为 `.gov.dn42`
