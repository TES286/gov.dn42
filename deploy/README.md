# gov.dn42 部署指南

本文档说明如何将 gov.dn42 前端与后端部署到生产环境。

## 架构

```
┌────────────┐     ┌─────────────┐     ┌──────────────┐
│  浏览器     │────▶│   Caddy     │────▶│  后端 (node)  │
│            │     │  :443 TLS   │     │  :8787       │
└────────────┘     └─────┬───────┘     └──────┬───────┘
                         │静态文件              │
                         ▼                      ▼
                   /var/www/gov-dn42      PostgreSQL
                   /dist                  :5432
```

- **Caddy**：统一入口，自动 HTTPS，反代 `/api/v1/*` 到后端，serve 前端静态文件
- **后端**：Node.js + TypeScript，由 systemd 管理，连接 PostgreSQL
- **PostgreSQL**：存储子域名申请、委派记录、会话、举报/意见

## 前置要求

- Linux 服务器（推荐 Debian 12+ / Ubuntu 22.04+）
- 域名 `gov.dn42`（DN42 内部 DNS 已解析到此服务器）
- PostgreSQL 14+
- Caddy 2.6+
- Node.js 20+（生产可用 22 LTS）
- tsx（全局安装：`npm i -g tsx`）

## 1. 部署代码

```bash
sudo mkdir -p /opt/gov-dn42
sudo chown $USER:$USER /opt/gov-dn42
git clone https://github.com/TES286/gov.dn42.git /opt/gov-dn42
cd /opt/gov-dn42
pnpm install --frozen-lockfile --prod
pnpm build
```

## 2. 初始化 PostgreSQL

```bash
# 在 PG 服务器上
sudo -u postgres psql -f deploy/postgres-init.sql
# 编辑 backend.env 填入相同密码
```

## 3. 配置环境变量

```bash
sudo mkdir -p /etc/gov-dn42
sudo cp deploy/backend.env.example /etc/gov-dn42/backend.env
sudo nano /etc/gov-dn42/backend.env
# 填入 PG_CONNECTION_STRING 与 OIDC client_secret
sudo chown gov-dn42:gov-dn42 /etc/gov-dn42/backend.env
sudo chmod 600 /etc/gov-dn42/backend.env
```

## 4. 创建系统用户

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin gov-dn42
sudo chown -R gov-dn42:gov-dn42 /opt/gov-dn42
sudo mkdir -p /var/lib/gov-dn42
sudo chown gov-dn42:gov-dn42 /var/lib/gov-dn42
```

## 5. 安装 systemd unit

```bash
sudo cp deploy/gov-dn42-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gov-dn42-backend
sudo systemctl status gov-dn42-backend
journalctl -u gov-dn42-backend -f
```

后端首次启动时会自动初始化 schema（幂等）。

## 6. 配置 Caddy

```bash
sudo mkdir -p /etc/caddy/Caddyfile.d
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile.d/gov-dn42
# 主 Caddyfile 加入：import /etc/caddy/Caddyfile.d/*
sudo nano /etc/caddy/Caddyfile
# 在最后加：import Caddyfile.d/*

# 部署前端
sudo mkdir -p /var/www/gov-dn42
sudo cp -r dist /var/www/gov-dn42/dist
sudo chown -R caddy:caddy /var/www/gov-dn42

sudo systemctl reload caddy
```

## 7. 验证

```bash
curl https://gov.dn42/api/v1/subdomains/availability?name=home
# 期望：{"name":"home","available":true}
```

## bind9 DLZ 集成

bind9 可通过 DLZ 模块直接查询 PostgreSQL 中的委派记录，见 `dlz/` 目录。

## 运维

- **日志**：`journalctl -u gov-dn42-backend -f`
- **重启**：`sudo systemctl restart gov-dn42-backend`
- **更新**：`git pull && pnpm install --prod && pnpm build && sudo systemctl restart gov-dn42-backend && sudo cp -r dist /var/www/gov-dn42/dist`
- **备份**：定期 `pg_dump gov_dn42 > backup.sql`

## 安全注意事项

- `backend.env` 权限设为 600，仅 gov-dn42 用户可读
- Caddy 自动处理 TLS；后端监听 localhost:8787，不对外暴露
- PostgreSQL 限制连接数与网络访问
- OIDC client_secret 切勿提交到 git
- 生产环境 dev 端点 `/_dev/create-session` 自动禁用（PG_CONNECTION_STRING 已设）
