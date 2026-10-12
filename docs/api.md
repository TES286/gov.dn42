# gov.dn42 在线服务 API 接口契约（v1）

> 状态：**草案（未实现）**。本文档定义子域名注册服务的后端接口契约；
> 前端已按此契约完成对接（见 `src/lib/api.ts`），后端实现后即可联调。

## 约定

- **Base URL**：`/api/v1`（前端可通过 `VITE_API_BASE` 环境变量指向其他地址，如 `https://api.gov.dn42/v1`）
- **数据格式**：请求与响应均为 `application/json; charset=utf-8`
- **版本策略**：URL 路径版本（`/api/v1`），不兼容变更须升级主版本号
- **鉴权**：v1 暂不鉴权；后续如引入身份验证，将使用 `Authorization: Bearer <token>`
- **限频**：写接口建议 ≤10 次/分钟/IP，超限返回 429

## 错误响应格式

所有非 2xx 响应返回统一结构：

```json
{
  "error": {
    "code": "NAME_RESERVED",
    "message": "该子域名属于保留字，不能分配"
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `error.code` | string | 机器可读错误码，大写蛇形命名 |
| `error.message` | string | 人类可读错误描述（中文） |

### 通用错误码

| HTTP | code | 说明 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | 请求参数缺失或格式错误 |
| 404 | `NOT_FOUND` | 资源不存在（后端未部署时静态托管也会返回 404） |
| 405 | `METHOD_NOT_ALLOWED` | HTTP 方法不支持 |
| 409 | `NAME_TAKEN` | 子域名已被占用 |
| 429 | `RATE_LIMITED` | 请求过于频繁 |
| 5xx | `INTERNAL_ERROR` | 服务器内部错误 |

> 前端将 **网络失败 / 404 / 405 / 5xx** 统一识别为"服务未上线或不可用"并优雅降级
> （见 `src/lib/api.ts` 的 `isServiceUnavailable()`），不向用户抛出裸错误。

## 接口列表

### 1. 查询子域名可用性

```
GET /api/v1/subdomains/availability?name={name}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 是 | 待查询的子域名（不含 `.dn42` 后缀），2-63 字符 |

**响应 200**

```json
{
  "name": "example",
  "available": true
}
```

不可用时附 `reason`：

```json
{
  "name": "www",
  "available": false,
  "reason": "该子域名属于保留字，不能分配"
}
```

**校验规则**

- 命名：`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`，长度 2-63
- 保留字（初始集合，允许后端扩充）：
  `www, gov, mail, ns, ns1, ns2, api, cdn, root, dns, whois, irc, registry, wiki`

### 2. 提交子域名注册申请

```
POST /api/v1/subdomains
Content-Type: application/json
```

**请求体**

```json
{
  "name": "example",
  "purpose": "个人主页",
  "ipv4": "172.20.0.1",
  "ipv6": "fd42::1",
  "contact": "user@example.com",
  "note": "可选补充说明",
  "agree": true
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 是 | 子域名，规则同上 |
| `purpose` | string | 是 | 用途：`个人主页` / `项目站点` / `网络服务` / `其他` |
| `ipv4` | string | 与 ipv6 至少一项 | A 记录指向地址（后端严格校验） |
| `ipv6` | string | 与 ipv4 至少一项 | AAAA 记录指向地址（后端严格校验） |
| `contact` | string | 是 | 联系邮箱 |
| `note` | string | 否 | 补充说明，≤500 字符 |
| `agree` | boolean | 是 | 须为 `true`（同意《子域名分配管理办法（试行）》） |

**响应 202 Accepted**

```json
{
  "id": "sd-20261012-a1b2c3",
  "name": "example",
  "status": "pending"
}
```

**错误**

- `400 VALIDATION_ERROR`：字段缺失或格式错误
- `409 NAME_TAKEN`：已被占用或属于保留字
- `429 RATE_LIMITED`：请求过于频繁

### 3. 查询申请进度（规划中）

```
GET /api/v1/subdomains/{id}
```

**响应 200**

```json
{
  "id": "sd-20261012-a1b2c3",
  "name": "example",
  "status": "pending",
  "createdAt": "2026-10-12T08:00:00Z"
}
```

`status` 取值：`pending`（待审核）/ `approved`（已通过）/ `rejected`（已驳回，附 `reason` 字段）。

## 后端实现建议

- **同源部署（推荐）**：前端静态托管后，`/api/v1` 由反向代理转发至后端服务，避免 CORS；
  如前后端分离域名，后端须配置仅允许门户站点来源的 CORS
- **生效方式**：审核通过后向 DN42 Registry 提交 zone delegation（参见官方 Wiki 的 DNS 章节）
- **数据落地**：建议记录申请时间、来源 IP（限频与审计用）与审核状态流转
- **审核流**：v1 采用人工审核；后续可增加自动化预检（保留字、格式、归属地校验）

## 变更记录

| 日期 | 说明 |
| --- | --- |
| 2026-10-12 | 初版契约草案发布 |
