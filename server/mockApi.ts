/**
 * gov.dn42 demo 后端（mock）
 *
 * 零依赖（仅 node:http）实现 docs/api.md 全部接口：
 *   1. GET  /api/v1/subdomains/availability?name=X
 *   2. POST /api/v1/subdomains
 *   3. GET  /api/v1/subdomains/:id
 *   4. POST /api/v1/submissions
 *   5. POST /api/v1/auth/oidc/callback
 *   6. GET  /api/v1/admin/subdomains
 *   7. POST /api/v1/admin/subdomains/:id/{approve,reject}
 *
 * 数据存储在内存，重启即重置。OIDC ID token 仅解码 payload、不做签名校验——
 * 仅供开发演示，生产部署必须用 JWKS 校验签名。
 *
 * 两种运行方式：
 *   1. 作为 Vite 插件挂载到 dev server（见 vite.config.ts 的 mockApi()）
 *   2. 独立运行：node --import tsx server/mockApi.ts
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';

const PORT = Number(process.env.MOCK_PORT ?? 8787);

/* ============================================================
 * 数据模型（内存存储）
 * ============================================================ */

interface SubdomainApplication {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  ns: string[];
  ds: string[];
  purpose: string;
  contact: string;
  note: string;
  auth: { providerId: string; sub: string };
  createdAt: string;
  reason?: string;
}

interface Submission {
  id: string;
  type: 'report' | 'feedback';
  category: string;
  content: string;
  target?: string;
  contact?: string;
  createdAt: string;
}

const applications = new Map<string, SubdomainApplication>();
const submissions = new Map<string, Submission>();

/* ============================================================
 * 工具
 * ============================================================ */

const RESERVED = new Set([
  'www', 'gov', 'mail', 'ns', 'ns1', 'ns2', 'api', 'cdn', 'root', 'dns',
  'whois', 'irc', 'registry', 'wiki', 'admin', 'portal', 'auth',
]);

const NAME_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const NS_PATTERN = /^[a-z0-9]([a-z0-9.-]{0,253}[a-z0-9])?$/i;
const DS_PATTERN = /^\d{1,5}\s+\d{1,3}\s+[124]\s+[0-9a-fA-F]{20,128}$/;

function genId(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = randomBytes(3).toString('hex');
  return `${prefix}-${date}-${rand}`;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
  });
  res.end(data);
}

function error(res: ServerResponse, status: number, code: string, message: string): void {
  json(res, status, { error: { code, message } });
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/* ============================================================
 * OIDC 提供商配置（与 src/lib/oidc.ts 对齐）
 * ============================================================ */

interface OidcProvider {
  id: string;
  tokenEndpoint: string;
  userinfoEndpoint?: string;
  clientId: string;
}

const OIDC_PROVIDERS: Record<string, OidcProvider> = {
  iedon: {
    id: 'iedon',
    tokenEndpoint: 'https://auth.iedon.net/token',
    userinfoEndpoint: 'https://auth.iedon.net/userinfo',
    clientId: '74f53c92f6039374ecc1981d59b0be70',
  },
  'g-load': {
    id: 'g-load',
    tokenEndpoint: 'https://dn42.g-load.eu/oauth2/token',
    userinfoEndpoint: 'https://dn42.g-load.eu/oauth2/userinfo',
    clientId: 'cbb31e4f-af83-4df7-b362-1b50ab1c6607',
  },
  hexpnet: {
    id: 'hexpnet',
    tokenEndpoint: 'https://auth42.hexpnet.work/auth/oauth/token',
    userinfoEndpoint: 'https://auth42.hexpnet.work/auth/oauth/userinfo',
    clientId: 'XmR1nNxHU17snGVi',
  },
};

/** 解码 JWT payload（不校验签名——mock 专用） */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** 向 OIDC 提供商 token 端点交换授权码 */
async function exchangeCode(
  provider: OidcProvider,
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<{ idToken?: string; accessToken?: string } | null> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: provider.clientId,
    code_verifier: codeVerifier,
  });

  try {
    const resp = await fetch(provider.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });
    if (!resp.ok) {
      console.error(`[mock] token endpoint ${provider.id} returned ${resp.status}: ${await resp.text()}`);
      return null;
    }
    const data = (await resp.json()) as {
      id_token?: string;
      access_token?: string;
      token_type?: string;
    };
    return { idToken: data.id_token, accessToken: data.access_token };
  } catch (err) {
    console.error(`[mock] token exchange failed for ${provider.id}:`, err);
    return null;
  }
}

/* ============================================================
 * 路由分发
 * ============================================================ */

const API_PREFIX = '/api/v1';

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;
  const method = req.method ?? 'GET';

  if (!path.startsWith(API_PREFIX)) {
    error(res, 404, 'NOT_FOUND', 'Not a mock API path');
    return;
  }

  const sub = path.slice(API_PREFIX.length);

  try {
    // 1. 查询可用性
    if (sub === '/subdomains/availability' && method === 'GET') {
      const name = (url.searchParams.get('name') ?? '').trim().toLowerCase();
      if (!name || !NAME_PATTERN.test(name)) {
        error(res, 400, 'VALIDATION_ERROR', 'name 不合法');
        return;
      }
      if (RESERVED.has(name)) {
        json(res, 200, { name, available: false, reason: '该子域名属于保留字，不能分配' });
        return;
      }
      const taken = [...applications.values()].some(
        (a) => a.name === name && a.status !== 'rejected',
      );
      if (taken) {
        json(res, 200, { name, available: false, reason: '该子域名已被占用' });
        return;
      }
      json(res, 200, { name, available: true });
      return;
    }

    // 2. 提交注册申请
    if (sub === '/subdomains' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
      const name = String(body.name ?? '').trim().toLowerCase();
      const purpose = String(body.purpose ?? '').trim();
      const ns = Array.isArray(body.ns) ? body.ns.map(String) : [];
      const ds = Array.isArray(body.ds) ? body.ds.map(String) : [];
      const contact = String(body.contact ?? '').trim();
      const note = body.note ? String(body.note) : '';
      const agree = body.agree === true;
      const auth = body.auth as { providerId: string; sub: string } | undefined;

      if (!name || !NAME_PATTERN.test(name)) {
        error(res, 400, 'VALIDATION_ERROR', 'name 不合法');
        return;
      }
      if (!purpose) {
        error(res, 400, 'VALIDATION_ERROR', 'purpose 缺失');
        return;
      }
      if (ns.length < 2 || !ns.every((n) => NS_PATTERN.test(n))) {
        error(res, 400, 'VALIDATION_ERROR', 'ns 至少 2 条且为有效 FQDN');
        return;
      }
      if (ds.length > 0 && !ds.every((d) => DS_PATTERN.test(d))) {
        error(res, 400, 'VALIDATION_ERROR', 'ds 格式不正确');
        return;
      }
      if (!contact) {
        error(res, 400, 'VALIDATION_ERROR', 'contact 缺失');
        return;
      }
      if (!agree) {
        error(res, 400, 'VALIDATION_ERROR', 'agree 须为 true');
        return;
      }
      if (!auth || !auth.providerId || !auth.sub) {
        error(res, 401, 'AUTH_REQUIRED', '需要身份认证');
        return;
      }
      if (RESERVED.has(name)) {
        error(res, 409, 'NAME_TAKEN', '该子域名属于保留字');
        return;
      }
      const taken = [...applications.values()].some(
        (a) => a.name === name && a.status !== 'rejected',
      );
      if (taken) {
        error(res, 409, 'NAME_TAKEN', '该子域名已被占用');
        return;
      }

      const id = genId('sd');
      const app: SubdomainApplication = {
        id,
        name,
        status: 'pending',
        ns,
        ds,
        purpose,
        contact,
        note,
        auth,
        createdAt: new Date().toISOString(),
      };
      applications.set(id, app);
      console.log(`[mock] subdomain application ${id}: ${name}.gov.dn42 (pending)`);
      json(res, 202, { id, name, status: 'pending' });
      return;
    }

    // 3. 查询申请进度
    const getMatch = sub.match(/^\/subdomains\/([^/]+)$/);
    if (getMatch && method === 'GET') {
      const id = decodeURIComponent(getMatch[1]);
      const app = applications.get(id);
      if (!app) {
        error(res, 404, 'NOT_FOUND', '申请不存在');
        return;
      }
      json(res, 200, app);
      return;
    }

    // 4. 举报/意见
    if (sub === '/submissions' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
      const type = body.type as 'report' | 'feedback' | undefined;
      const category = String(body.category ?? '').trim();
      const content = String(body.content ?? '').trim();
      const target = body.target ? String(body.target) : undefined;
      const contact = body.contact ? String(body.contact) : undefined;

      if (!type || (type !== 'report' && type !== 'feedback')) {
        error(res, 400, 'VALIDATION_ERROR', 'type 须为 report 或 feedback');
        return;
      }
      if (!category) {
        error(res, 400, 'VALIDATION_ERROR', 'category 缺失');
        return;
      }
      if (content.length < 10 || content.length > 5000) {
        error(res, 400, 'VALIDATION_ERROR', 'content 长度须在 10–5000 之间');
        return;
      }

      const id = genId('sub');
      const sub_: Submission = {
        id,
        type,
        category,
        content,
        target,
        contact,
        createdAt: new Date().toISOString(),
      };
      submissions.set(id, sub_);
      console.log(`[mock] ${type} ${id}: ${category} (${content.length} chars)`);
      json(res, 202, { id, type, status: 'received' });
      return;
    }

    // 5. OIDC 回调
    if (sub === '/auth/oidc/callback' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as {
        providerId: string;
        code: string;
        codeVerifier: string;
        redirectUri: string;
      };

      const provider = OIDC_PROVIDERS[body.providerId];
      if (!provider) {
        error(res, 400, 'VALIDATION_ERROR', `不支持的 providerId: ${body.providerId}`);
        return;
      }
      if (!body.code || !body.codeVerifier || !body.redirectUri) {
        error(res, 400, 'VALIDATION_ERROR', 'code / codeVerifier / redirectUri 缺失');
        return;
      }

      const tokens = await exchangeCode(provider, body.code, body.codeVerifier, body.redirectUri);
      if (!tokens || !tokens.idToken) {
        error(res, 401, 'AUTH_FAILED', 'token 交换失败');
        return;
      }

      const payload = decodeJwtPayload(tokens.idToken);
      if (!payload) {
        error(res, 401, 'AUTH_FAILED', 'ID token 解码失败');
        return;
      }

      // mock：不做签名校验，直接信任 payload
      const user = {
        providerId: provider.id,
        sub: String(payload.sub ?? ''),
        name: payload.name != null ? String(payload.name) : undefined,
        email: payload.email != null ? String(payload.email) : undefined,
        dn42: payload.dn42 != null ? String(payload.dn42) : undefined,
      };
      console.log(`[mock] OIDC callback ${provider.id}: sub=${user.sub}`);
      json(res, 200, { user });
      return;
    }

    // 6. 管理员列表
    const adminListMatch = sub.match(/^\/admin\/subdomains$/);
    if (adminListMatch && method === 'GET') {
      const status = url.searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
      let items = [...applications.values()].sort(
        (a, b) => b.createdAt.localeCompare(a.createdAt),
      );
      if (status) {
        items = items.filter((a) => a.status === status);
      }
      json(res, 200, { items });
      return;
    }

    // 7. 管理员审批
    const approveMatch = sub.match(/^\/admin\/subdomains\/([^/]+)\/approve$/);
    if (approveMatch && method === 'POST') {
      const id = decodeURIComponent(approveMatch[1]);
      const app = applications.get(id);
      if (!app) {
        error(res, 404, 'NOT_FOUND', '申请不存在');
        return;
      }
      if (app.status !== 'pending') {
        error(res, 409, 'INVALID_STATE', '申请已处理');
        return;
      }
      app.status = 'approved';
      console.log(`[mock] subdomain ${id} approved: ${app.name}.gov.dn42`);
      json(res, 200, { id, status: 'approved' });
      return;
    }

    const rejectMatch = sub.match(/^\/admin\/subdomains\/([^/]+)\/reject$/);
    if (rejectMatch && method === 'POST') {
      const id = decodeURIComponent(rejectMatch[1]);
      const app = applications.get(id);
      if (!app) {
        error(res, 404, 'NOT_FOUND', '申请不存在');
        return;
      }
      if (app.status !== 'pending') {
        error(res, 409, 'INVALID_STATE', '申请已处理');
        return;
      }
      const body = JSON.parse(await readBody(req)) as { reason?: string };
      if (!body.reason || !body.reason.trim()) {
        error(res, 400, 'VALIDATION_ERROR', 'reason 缺失');
        return;
      }
      app.status = 'rejected';
      app.reason = body.reason.trim();
      console.log(`[mock] subdomain ${id} rejected: ${app.name}.gov.dn42 (${app.reason})`);
      json(res, 200, { id, status: 'rejected', reason: app.reason });
      return;
    }

    // 未匹配
    error(res, 404, 'NOT_FOUND', `无此路由: ${method} ${sub}`);
  } catch (err) {
    console.error('[mock] handler error:', err);
    error(res, 500, 'INTERNAL_ERROR', err instanceof Error ? err.message : 'unknown error');
  }
}

/* ============================================================
 * 导出：HTTP handler（供 Vite 插件使用）与独立服务器入口
 * ============================================================ */

export const mockApiHandler = handleRequest;

/** 独立运行入口 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer((req, res) => {
    // CORS（dev 方便前端跨域调用）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    void handleRequest(req, res);
  });
  server.listen(PORT, () => {
    console.log(`[mock] gov.dn42 mock API listening on http://localhost:${PORT}${API_PREFIX}`);
  });
}
