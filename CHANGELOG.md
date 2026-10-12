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
- 全站设计系统：政务深蓝金配色、政府徽标、响应式与打印样式
- GitHub Pages 自动部署工作流、robots.txt 与 sitemap.xml

### Changed

- 技术栈自 create-vite 默认模板迁移为门户站点结构（React 19 + Vite 8 + react-router-dom）
