# gov.dn42 在线服务 API 接口契约（v1）

> 状态：**草案**。本文档定义子域名注册服务的后端接口契约；
> 前端已按此契约完成对接（见 `src/lib/api.ts`），mock 后端见 `server/mockApi.ts`。
>
> 委派模式：子域名采用 NS 委派——申请者提供至少 2 个 NS 记录，政府将
> `<name>.gov.dn42` 的 NS 委派给申请者指定的名称服务器；DS 记录可选（DNSSEC）。
> 审批后由管理员向 DN42 Registry 提交 zone delegation。

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
| 401 | `AUTH_REQUIRED` | 需要身份认证 |
| 403 | `FORBIDDEN` | 无权访问（如非管理员调用管理员端点） |
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
| `name` | string | 是 | 待查询的子域名（不含 `.gov.dn42` 后缀），2-63 字符 |

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

子域名采用 **NS 委派**模式：申请者提供至少 2 个 NS 记录，政府将
`<name>.gov.dn42` 的 NS 委派给申请者指定的名称服务器；DS 记录可选（用于
DNSSEC 链式签名）。审批通过后由管理员向 DN42 Registry 提交 zone delegation。

**请求体**

```json
{
  "name": "example",
  "purpose": "personal",
  "ns": ["ns1.example.gov.dn42", "ns2.example.gov.dn42"],
  "ds": ["12345 8 2 ABCDEF0123456789..."],
  "contact": "user@example.com",
  "note": "可选补充说明",
  "agree": true,
  "auth": {
    "providerId": "iedon",
    "sub": "subject-id"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 是 | 子域名，规则同上 |
| `purpose` | string | 是 | 用途：`personal` / `project` / `service` / `other` |
| `ns` | string[] | 是 | NS 记录列表，至少 2 个名称服务器（FQDN，不含 `.gov.dn42` 后缀亦可） |
| `ds` | string[] | 否 | DS 记录列表（DNSSEC），格式 `<keyTag> <algorithm> <digestType> <digest>` |
| `contact` | string | 是 | 联系邮箱 |
| `note` | string | 否 | 补充说明，≤500 字符 |
| `agree` | boolean | 是 | 须为 `true`（同意《子域名分配管理办法（试行）》） |
| `auth` | object | 是 | 已认证用户标识，见接口 5 |

**NS 记录校验规则**

- 每条为一个 FQDN，格式 `^[a-z0-9]([a-z0-9.-]{0,253}[a-z0-9])?$`，长度 ≤253
- 至少 2 条，至多 10 条
- 各条不可重复

**DS 记录校验规则（可选）**

- 每条格式 `<keyTag> <algorithm> <digestType> <digest>`，空格分隔
- `keyTag`：1–65535；`algorithm`：常见值 8/10/13/14/15/16；`digestType`：1（SHA1）/2（SHA256）/4（SHA384）
- `digest`：16 进制字符串，长度依 `digestType` 而定

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
- `401 AUTH_REQUIRED`：未携带 `auth` 或身份核验未通过
- `409 NAME_TAKEN`：已被占用或属于保留字
- `429 RATE_LIMITED`：请求过于频繁

### 3. 查询申请进度

```
GET /api/v1/subdomains/{id}
```

**响应 200**

```json
{
  "id": "sd-20261012-a1b2c3",
  "name": "example",
  "status": "pending",
  "ns": ["ns1.example.gov.dn42", "ns2.example.gov.dn42"],
  "ds": [],
  "purpose": "personal",
  "contact": "user@example.com",
  "createdAt": "2026-10-12T08:00:00Z",
  "auth": { "providerId": "iedon", "sub": "subject-id" }
}
```

`status` 取值：`pending`（待审核）/ `approved`（已通过）/ `rejected`（已驳回，附 `reason` 字段）。

### 4. 提交举报或意见

```
POST /api/v1/submissions
Content-Type: application/json
```

统一受理举报（`type=report`）与意见（`type=feedback`）两类提交。后端将记录写入日志留档（默认落盘至 `/dev/null`，生产部署可配置为持久化存储）。

**请求体**

```json
{
  "type": "report",
  "category": "misconduct",
  "content": "具体描述……",
  "target": "被举报对象（仅 report 适用，选填）",
  "contact": "user@example.com"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | string | 是 | `report`（举报）/ `feedback`（意见） |
| `category` | string | 是 | 类别键，见下表 |
| `content` | string | 是 | 正文，长度 10–5000 字符 |
| `target` | string | 否 | 被举报对象；仅 `report` 适用 |
| `contact` | string | 否 | 联系方式（邮箱或 DN42 内可达标识），便于后续核实 |

**类别键**

| `type` | `category` 取值 |
| --- | --- |
| `report` | `misconduct`（违规行为）/ `service`（服务问题）/ `dispute`（资源争议）/ `other`（其他） |
| `feedback` | `website`（网站建议）/ `service`（服务建议）/ `policy`（政策建议）/ `other`（其他） |

**响应 202 Accepted**

```json
{
  "id": "sub-20261012-d4e5f6",
  "type": "report",
  "status": "received"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 受理编号，用于查询与追溯 |
| `type` | string | 回显类型 |
| `status` | string | 固定为 `received`（已接收） |

**错误**

- `400 VALIDATION_ERROR`：字段缺失或格式错误（如 `content` 不足 10 字符）
- `429 RATE_LIMITED`：请求过于频繁

> 前端将 **网络失败 / 404 / 405 / 5xx** 统一识别为“受理服务尚未上线”并优雅降级，
> 不向用户抛出裸错误。

**隐私与留档说明**

- `contact` 字段在留档日志中以脱敏形式记录，仅用于本事项的核实与反馈
- 举报人信息严格保密；日志默认写入 `/dev/null`，可在后端配置为持久化存储
- 留档保留期限由部署方决定；本契约不强制要求查询接口

### 5. OIDC 身份认证回调

子域名注册等需实名的在线服务，以 DN42 社区内部 OIDC 为前置认证。前端采用
Authorization Code + PKCE 流程发起授权；回调页将授权码交由后端换取 token 并校验
ID token 签名，后端回传已认证用户信息。

支持的 OIDC 提供商（发现端点）：

| 提供商标识 | 发现文档 |
| --- | --- |
| `iedon` | `https://auth.iedon.net/.well-known/openid-configuration` |
| `g-load` | `https://dn42.g-load.eu/.well-known/openid-configuration` |
| `hexpnet` | `https://auth42.hexpnet.work/.well-known/openid-configuration` |

请求的 scope：`openid profile email dn42`（`dn42` 为社区专属声明）。

```
POST /api/v1/auth/oidc/callback
Content-Type: application/json
```

**请求体**

```json
{
  "providerId": "iedon",
  "code": "授权码",
  "codeVerifier": "PKCE code_verifier",
  "redirectUri": "https://gov.dn42/auth/callback"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `providerId` | string | 是 | `iedon` / `g-load` / `hexpnet` |
| `code` | string | 是 | OIDC 提供商重定向回传的授权码 |
| `codeVerifier` | string | 是 | 前端生成的 PKCE code_verifier |
| `redirectUri` | string | 是 | 授权时使用的重定向地址，须与授权请求一致 |

**响应 200**

```json
{
  "user": {
    "providerId": "iedon",
    "sub": "subject-id",
    "name": "Display Name",
    "email": "user@example.com",
    "dn42": "AS-号码或社区标识"
  }
}
```

后端处理流程：使用 `code` + `codeVerifier` 向提供商 token 端点换取 token；
校验 ID token 的 `iss`、`aud`、`exp` 与签名（RS256，JWKS 见各提供商发现文档）；
提取 `sub`、`name`、`email`、`dn42` 等声明回传前端。

**错误**

- `400 VALIDATION_ERROR`：`providerId` 不支持、`code` 缺失或 state/verifier 校验失败
- `401 AUTH_FAILED`：token 交换或 ID token 校验失败
- `502 UPSTREAM_ERROR`：OIDC 提供商不可达

> 前端将 **网络失败 / 404 / 405 / 5xx** 统一识别为“认证服务尚未上线”并优雅降级。

### 子域名注册的认证要求

`POST /api/v1/subdomains`（接口 2）在引入 OIDC 后，请求体增加可选字段 `auth`：

```json
{
  "name": "example",
  "purpose": "personal",
  "...": "...",
  "auth": {
    "providerId": "iedon",
    "sub": "subject-id"
  }
}
```

后端凭 `auth.providerId` + `auth.sub` 与已认证会话核验申请人身份；未通过认证的
申请将返回 `401 AUTH_REQUIRED`。

### 6. 管理员：列出全部申请

```
GET /api/v1/admin/subdomains[?status=pending]
```

管理员端点，用于审核。mock 阶段不强制鉴权；生产部署须校验管理员身份。

**查询参数**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `status` | string | 可选过滤：`pending` / `approved` / `rejected`；不传返回全部 |

**响应 200**

```json
{
  "items": [
    {
      "id": "sd-20261012-a1b2c3",
      "name": "example",
      "status": "pending",
      "ns": ["ns1.example.gov.dn42", "ns2.example.gov.dn42"],
      "ds": [],
      "purpose": "personal",
      "contact": "user@example.com",
      "note": "",
      "auth": { "providerId": "iedon", "sub": "subject-id" },
      "createdAt": "2026-10-12T08:00:00Z"
    }
  ]
}
```

**错误**

- `403 FORBIDDEN`：非管理员（生产部署）

### 7. 管理员：审批申请

```
POST /api/v1/admin/subdomains/{id}/approve
POST /api/v1/admin/subdomains/{id}/reject
```

**reject 请求体**

```json
{ "reason": "驳回理由" }
```

**响应 200**

```json
{
  "id": "sd-20261012-a1b2c3",
  "status": "approved"
}
```

驳回时附 `reason`：

```json
{
  "id": "sd-20261012-a1b2c3",
  "status": "rejected",
  "reason": "NS 记录指向的名称服务器无响应"
}
```

**错误**

- `404 NOT_FOUND`：申请不存在
- `409 INVALID_STATE`：申请已处理（非 pending）
- `400 VALIDATION_ERROR`：reject 缺少 `reason`

审批通过后，管理员须手动向 DN42 Registry 提交 zone delegation（NS + DS）。
mock 后端仅记录状态流转，不自动提交 Registry。

## 后端实现建议

- **同源部署（推荐）**：前端静态托管后，`/api/v1` 由反向代理转发至后端服务，避免 CORS；
  如前后端分离域名，后端须配置仅允许门户站点来源的 CORS
- **生效方式**：审核通过后由管理员向 DN42 Registry 提交 zone delegation——
  在 `db/dns/gov.dn42` 中增加 NS 与 DS 记录（参见官方 Wiki 的 DNS 章节）
- **数据落地**：建议记录申请时间、来源 IP（限频与审计用）与审核状态流转
- **审核流**：v1 采用人工审核；管理员通过 `/admin` 页面或管理员端点审批；
  后续可增加自动化预检（保留字、格式、NS 可达性校验）
- **举报/意见留档**：写入日志文件（mock 后端写入内存，可配置为文件或对象存储）；
  建议 `contact` 字段脱敏后存储；留档仅供改进与审计参考，不对外公开

## Mock 后端

`server/mockApi.ts` 提供一份零依赖（仅 `node:http`）的 demo 后端，
实现全部接口（1–7）+ OIDC 回调。数据存储在内存，重启即重置。

开发模式下作为 Vite 插件自动挂载到 `/api/v1`（见 `vite.config.ts`），
无需单独启动；也可独立运行：

```bash
node --import tsx server/mockApi.ts
```

mock 后端对 OIDC ID token 仅解码 payload、不做签名校验——仅供开发演示，
生产部署必须用 JWKS 校验签名。

## 变更记录

| 日期 | 说明 |
| --- | --- |
| 2026-10-12 | 初版契约草案发布；新增举报与意见箱提交接口（`POST /api/v1/submissions`）；新增 OIDC 认证回调接口（`POST /api/v1/auth/oidc/callback`） |
| 2026-10-12 | 子域名改为 NS 委派模式（`ns` / `ds` 字段替换 `ipv4` / `ipv6`）；新增管理员端点（6、7）；新增 mock 后端（`server/mockApi.ts`） |
