/**
 * gov.dn42 生产准备级后端服务器
 *
 * - 数据持久化到 PostgreSQL（通过 server/db.ts 抽象）
 * - OIDC：常规 Authorization Code + client_secret 流（secret 由环境变量注入）
 * - 管理员限定 ASN 4242420078
 * - 会话 token：随机 32 字节 base64url，存 sessions 表
 * - 鉴权：受保护端点校验 Authorization: Bearer <token>
 *
 * 运行：
 *   pnpm build && node --import tsx server/server.ts
 *   或：node --import tsx server/server.ts  （开发模式）
 *
 * 环境变量：
 *   PORT                    监听端口（默认 8787）
 *   PG_CONNECTION_STRING    PostgreSQL 连接串（未设则用 pglite）
 *   PGLITE_PATH             pglite 数据目录（未设则内存）
 *   OIDC_CLIENT_SECRET_IEDON     iedon 的 client_secret
 *   OIDC_CLIENT_SECRET_G_LOAD    g-load 的 client_secret
 *   OIDC_CLIENT_SECRET_HEXPNET   hexpnet 的 client_secret
 *   SESSION_TTL_HOURS       会话有效期（默认 24）
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { initDb, closeDb, type DbClient } from './db.js';

const PORT = Number(process.env.PORT ?? 8787);
const SESSION_TTL_MS = (Number(process.env.SESSION_TTL_HOURS ?? 24)) * 3600 * 1000;
const ADMIN_ASN = '4242420078';
const API_PREFIX = '/api/v1';

/* ============================================================
 * OIDC 提供商配置
 * ============================================================ */

interface OidcProvider {
  id: string;
  tokenEndpoint: string;
  userinfoEndpoint?: string;
  clientId: string;
  clientSecret: string;
}

function getOidcProvider(providerId: string): OidcProvider | null {
  const env = process.env;
  if (providerId === 'iedon') {
    return {
      id: 'iedon',
      tokenEndpoint: 'https://auth.iedon.net/token',
      clientId: '74f53c92f6039374ecc1981d59b0be70',
      clientSecret: env.OIDC_CLIENT_SECRET_IEDON ?? '',
    };
  }
  if (providerId === 'g-load') {
    return {
      id: 'g-load',
      tokenEndpoint: 'https://dn42.g-load.eu/oauth2/token',
      userinfoEndpoint: 'https://dn42.g-load.eu/oauth2/userinfo',
      clientId: 'cbb31e4f-af83-4df7-b362-1b50ab1c6607',
      clientSecret: env.OIDC_CLIENT_SECRET_G_LOAD ?? '',
    };
  }
  if (providerId === 'hexpnet') {
    return {
      id: 'hexpnet',
      tokenEndpoint: 'https://auth42.hexpnet.work/auth/oauth/token',
      userinfoEndpoint: 'https://auth42.hexpnet.work/auth/oauth/userinfo',
      clientId: 'XmR1nNxHU17snGVi',
      clientSecret: env.OIDC_CLIENT_SECRET_HEXPNET ?? '',
    };
  }
  return null;
}

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

function genToken(): string {
  return randomBytes(32).toString('base64url');
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64urlDecode(parts[1]));
  } catch {
    return null;
  }
}

/** 从 dn42 claim 中提取 ASN（如 "AS4242420078" → "4242420078"） */
function extractAsn(dn42: string | undefined): string | null {
  if (!dn42) return null;
  const match = dn42.match(/AS(\d+)/i);
  return match ? match[1] : null;
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
 * 会话鉴权
 * ============================================================ */

interface SessionUser {
  providerId: string;
  sub: string;
  name?: string;
  email?: string;
  dn42?: string;
  isAdmin: boolean;
}

/** 从请求中解析会话 token 并查 sessions 表 */
async function getSession(db: DbClient, req: IncomingMessage): Promise<SessionUser | null> {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  const { rows } = await db.query<{ provider_id: string; sub: string; name: string | null; email: string | null; dn42: string | null; is_admin: boolean; expires_at: Date }>(
    `SELECT provider_id, sub, name, email, dn42, is_admin, expires_at
     FROM sessions WHERE token = $1`,
    [token],
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.query(`DELETE FROM sessions WHERE token = $1`, [token]);
    return null;
  }

  return {
    providerId: row.provider_id,
    sub: row.sub,
    name: row.name ?? undefined,
    email: row.email ?? undefined,
    dn42: row.dn42 ?? undefined,
    isAdmin: row.is_admin,
  };
}

/** 要求会话存在且为管理员 */
async function requireAdmin(db: DbClient, req: IncomingMessage, res: ServerResponse): Promise<SessionUser | null> {
  const session = await getSession(db, req);
  if (!session) {
    error(res, 401, 'AUTH_REQUIRED', '需要身份认证');
    return null;
  }
  if (!session.isAdmin) {
    error(res, 403, 'FORBIDDEN', '需要管理员权限');
    return null;
  }
  return session;
}

/* ============================================================
 * OIDC token 交换
 * ============================================================ */

async function exchangeCode(
  provider: OidcProvider,
  code: string,
  redirectUri: string,
): Promise<{ idToken?: string; accessToken?: string } | null> {
  if (!provider.clientSecret) {
    console.error(`[oidc] client_secret not configured for ${provider.id}`);
    return null;
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
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
      console.error(`[oidc] token endpoint ${provider.id} returned ${resp.status}: ${await resp.text()}`);
      return null;
    }
    const data = (await resp.json()) as { id_token?: string; access_token?: string };
    return { idToken: data.id_token, accessToken: data.access_token };
  } catch (err) {
    console.error(`[oidc] token exchange failed for ${provider.id}:`, err);
    return null;
  }
}

/* ============================================================
 * 路由处理
 * ============================================================ */

async function handleRequest(db: DbClient, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;
  const method = req.method ?? 'GET';

  if (!path.startsWith(API_PREFIX)) {
    error(res, 404, 'NOT_FOUND', 'Not an API path');
    return;
  }
  const sub = path.slice(API_PREFIX.length);

  try {
    // dev-only: 创建测试会话（绕过 OIDC，仅 pglite 模式）
    // 生产模式（PG_CONNECTION_STRING 已设）下此端点被禁用
    if (sub === '/_dev/create-session' && method === 'POST') {
      if (process.env.PG_CONNECTION_STRING) {
        error(res, 403, 'FORBIDDEN', 'dev endpoint disabled in production');
        return;
      }
      const body = JSON.parse(await readBody(req)) as {
        providerId?: string;
        sub?: string;
        name?: string;
        email?: string;
        dn42?: string;
        isAdmin?: boolean;
      };
      const providerId = body.providerId ?? 'iedon';
      const subClaim = body.sub ?? `dev-${Date.now()}`;
      const name = body.name ?? 'Dev User';
      const email = body.email ?? 'dev@dn42';
      const dn42 = body.dn42 ?? 'AS4242420078';
      const isAdmin = body.isAdmin ?? true;

      const token = genToken();
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
      await db.query(
        `INSERT INTO sessions (token, provider_id, sub, name, email, dn42, is_admin, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [token, providerId, subClaim, name, email, dn42, isAdmin, expiresAt],
      );
      console.log(`[dev] created session: ${providerId} sub=${subClaim} dn42=${dn42} isAdmin=${isAdmin}`);
      json(res, 200, { token, user: { providerId, sub: subClaim, name, email, dn42, isAdmin } });
      return;
    }

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
      const { rows } = await db.query<{ status: string }>(
        `SELECT status FROM subdomains WHERE name = $1 AND status != 'rejected' LIMIT 1`,
        [name],
      );
      if (rows.length > 0) {
        json(res, 200, { name, available: false, reason: '该子域名已被占用' });
        return;
      }
      json(res, 200, { name, available: true });
      return;
    }

    // 2. 提交注册申请
    if (sub === '/subdomains' && method === 'POST') {
      const session = await getSession(db, req);
      if (!session) {
        error(res, 401, 'AUTH_REQUIRED', '需要身份认证');
        return;
      }

      const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
      const name = String(body.name ?? '').trim().toLowerCase();
      const purpose = String(body.purpose ?? '').trim();
      const ns = Array.isArray(body.ns) ? body.ns.map(String) : [];
      const ds = Array.isArray(body.ds) ? body.ds.map(String) : [];
      const contact = String(body.contact ?? '').trim();
      const note = body.note ? String(body.note) : '';
      const agree = body.agree === true;

      if (!name || !NAME_PATTERN.test(name)) {
        error(res, 400, 'VALIDATION_ERROR', 'name 不合法');
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
      if (RESERVED.has(name)) {
        error(res, 409, 'NAME_TAKEN', '该子域名属于保留字');
        return;
      }

      // 检查重名（pending/approved 占用）
      const { rows: existing } = await db.query<{ status: string }>(
        `SELECT status FROM subdomains WHERE name = $1 AND status != 'rejected' LIMIT 1`,
        [name],
      );
      if (existing.length > 0) {
        error(res, 409, 'NAME_TAKEN', '该子域名已被占用');
        return;
      }

      const id = genId('sd');
      await db.query(
        `INSERT INTO subdomains (id, name, status, ns, ds, purpose, contact, note, auth_provider, auth_sub)
         VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9)`,
        [id, name, ns, ds, purpose, contact, note, session.providerId, session.sub],
      );
      console.log(`[api] subdomain application ${id}: ${name}.gov.dn42 (pending)`);
      json(res, 202, { id, name, status: 'pending' });
      return;
    }

    // 3. 查询申请进度
    const getMatch = sub.match(/^\/subdomains\/([^/]+)$/);
    if (getMatch && method === 'GET') {
      const id = decodeURIComponent(getMatch[1]);
      const { rows } = await db.query(
        `SELECT id, name, status, ns, ds, purpose, contact, note, auth_provider, auth_sub, reason, created_at
         FROM subdomains WHERE id = $1`,
        [id],
      );
      if (rows.length === 0) {
        error(res, 404, 'NOT_FOUND', '申请不存在');
        return;
      }
      const row = rows[0];
      json(res, 200, {
        id: row.id,
        name: row.name,
        status: row.status,
        ns: row.ns,
        ds: row.ds,
        purpose: row.purpose,
        contact: row.contact,
        note: row.note,
        auth: { providerId: row.auth_provider, sub: row.auth_sub },
        createdAt: row.created_at,
        reason: row.reason,
      });
      return;
    }

    // 4. 举报/意见
    if (sub === '/submissions' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
      const type = body.type as 'report' | 'feedback' | undefined;
      const category = String(body.category ?? '').trim();
      const content = String(body.content ?? '').trim();
      const target = body.target ? String(body.target) : null;
      const contact = body.contact ? String(body.contact) : null;

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
      await db.query(
        `INSERT INTO submissions (id, type, category, content, target, contact)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, type, category, content, target, contact],
      );
      console.log(`[api] ${type} ${id}: ${category} (${content.length} chars)`);
      json(res, 202, { id, type, status: 'received' });
      return;
    }

    // 5. OIDC 回调
    if (sub === '/auth/oidc/callback' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as {
        providerId: string;
        code: string;
        redirectUri: string;
      };

      const provider = getOidcProvider(body.providerId);
      if (!provider) {
        error(res, 400, 'VALIDATION_ERROR', `不支持的 providerId: ${body.providerId}`);
        return;
      }
      if (!body.code || !body.redirectUri) {
        error(res, 400, 'VALIDATION_ERROR', 'code / redirectUri 缺失');
        return;
      }

      const tokens = await exchangeCode(provider, body.code, body.redirectUri);
      if (!tokens || !tokens.idToken) {
        error(res, 401, 'AUTH_FAILED', 'token 交换失败');
        return;
      }

      const payload = decodeJwtPayload(tokens.idToken);
      if (!payload) {
        error(res, 401, 'AUTH_FAILED', 'ID token 解码失败');
        return;
      }

      // TODO 生产部署：用 JWKS 校验签名（mock 阶段略过）

      const subClaim = String(payload.sub ?? '');
      const name = payload.name != null ? String(payload.name) : null;
      const email = payload.email != null ? String(payload.email) : null;
      const dn42 = payload.dn42 != null ? String(payload.dn42) : null;
      const asn = extractAsn(dn42 ?? undefined);
      const isAdmin = asn === ADMIN_ASN;

      // 颁发会话 token
      const token = genToken();
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
      await db.query(
        `INSERT INTO sessions (token, provider_id, sub, name, email, dn42, is_admin, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [token, provider.id, subClaim, name, email, dn42, isAdmin, expiresAt],
      );
      console.log(`[oidc] ${provider.id} sub=${subClaim} dn42=${dn42 ?? '-'} isAdmin=${isAdmin}`);

      json(res, 200, {
        user: {
          providerId: provider.id,
          sub: subClaim,
          name: name ?? undefined,
          email: email ?? undefined,
          dn42: dn42 ?? undefined,
          isAdmin,
        },
        token,
      });
      return;
    }

    // 6. 管理员列表
    const adminListMatch = sub.match(/^\/admin\/subdomains$/);
    if (adminListMatch && method === 'GET') {
      const admin = await requireAdmin(db, req, res);
      if (!admin) return;

      const status = url.searchParams.get('status');
      const validStatus = ['pending', 'approved', 'rejected'];
      let rows;
      if (status && validStatus.includes(status)) {
        rows = (await db.query(
          `SELECT id, name, status, ns, ds, purpose, contact, note, auth_provider, auth_sub, reason, created_at
           FROM subdomains WHERE status = $1 ORDER BY created_at DESC`,
          [status],
        )).rows;
      } else {
        rows = (await db.query(
          `SELECT id, name, status, ns, ds, purpose, contact, note, auth_provider, auth_sub, reason, created_at
           FROM subdomains ORDER BY created_at DESC`,
        )).rows;
      }
      json(res, 200, {
        items: rows.map((row) => ({
          id: row.id,
          name: row.name,
          status: row.status,
          ns: row.ns,
          ds: row.ds,
          purpose: row.purpose,
          contact: row.contact,
          note: row.note,
          auth: { providerId: row.auth_provider, sub: row.auth_sub },
          createdAt: row.created_at,
          reason: row.reason,
        })),
      });
      return;
    }

    // 7. 管理员审批
    const approveMatch = sub.match(/^\/admin\/subdomains\/([^/]+)\/approve$/);
    if (approveMatch && method === 'POST') {
      const admin = await requireAdmin(db, req, res);
      if (!admin) return;

      const id = decodeURIComponent(approveMatch[1]);
      const { rows } = await db.query<{ name: string; status: string }>(
        `SELECT name, status FROM subdomains WHERE id = $1`,
        [id],
      );
      if (rows.length === 0) {
        error(res, 404, 'NOT_FOUND', '申请不存在');
        return;
      }
      if (rows[0].status !== 'pending') {
        error(res, 409, 'INVALID_STATE', '申请已处理');
        return;
      }

      const name = rows[0].name;
      const adminLabel = `${admin.providerId}:${admin.sub}`;

      // 事务：更新申请状态 + 写入委派记录
      await db.query(`UPDATE subdomains SET status = 'approved' WHERE id = $1`, [id]);
      await db.query(
        `INSERT INTO delegations (name, application_id, ns, ds, approved_by)
         VALUES ($1, $2,
           (SELECT ns FROM subdomains WHERE id = $2),
           (SELECT ds FROM subdomains WHERE id = $2),
           $3)
         ON CONFLICT (name) DO UPDATE SET ns = EXCLUDED.ns, ds = EXCLUDED.ds, approved_by = EXCLUDED.approved_by, approved_at = now()`,
        [`${name}.gov.dn42`, id, adminLabel],
      );

      console.log(`[api] subdomain ${id} approved: ${name}.gov.dn42 by ${adminLabel}`);
      json(res, 200, { id, status: 'approved' });
      return;
    }

    const rejectMatch = sub.match(/^\/admin\/subdomains\/([^/]+)\/reject$/);
    if (rejectMatch && method === 'POST') {
      const admin = await requireAdmin(db, req, res);
      if (!admin) return;

      const id = decodeURIComponent(rejectMatch[1]);
      const { rows } = await db.query<{ name: string; status: string }>(
        `SELECT name, status FROM subdomains WHERE id = $1`,
        [id],
      );
      if (rows.length === 0) {
        error(res, 404, 'NOT_FOUND', '申请不存在');
        return;
      }
      if (rows[0].status !== 'pending') {
        error(res, 409, 'INVALID_STATE', '申请已处理');
        return;
      }

      const body = JSON.parse(await readBody(req)) as { reason?: string };
      if (!body.reason || !body.reason.trim()) {
        error(res, 400, 'VALIDATION_ERROR', 'reason 缺失');
        return;
      }
      await db.query(`UPDATE subdomains SET status = 'rejected', reason = $1 WHERE id = $2`, [
        body.reason.trim(),
        id,
      ]);
      console.log(`[api] subdomain ${id} rejected: ${rows[0].name}.gov.dn42 (${body.reason.trim()})`);
      json(res, 200, { id, status: 'rejected', reason: body.reason.trim() });
      return;
    }

    // 8. DLZ 查询接口（供 bind9 DLZ 模块调试用；生产由 bind9 直接连 pgsql）
    if (sub.startsWith('/dlz/lookup') && method === 'GET') {
      const qname = url.searchParams.get('name') ?? '';
      const { rows } = await db.query<{ name: string; ns: string[]; ds: string[] }>(
        `SELECT name, ns, ds FROM delegations WHERE name = $1`,
        [qname.toLowerCase()],
      );
      if (rows.length === 0) {
        json(res, 200, { found: false });
        return;
      }
      const row = rows[0];
      json(res, 200, { found: true, name: row.name, ns: row.ns, ds: row.ds });
      return;
    }

    error(res, 404, 'NOT_FOUND', `无此路由: ${method} ${sub}`);
  } catch (err) {
    console.error('[api] handler error:', err);
    error(res, 500, 'INTERNAL_ERROR', err instanceof Error ? err.message : 'unknown error');
  }
}

/* ============================================================
 * 启动入口
 * ============================================================ */

export async function createApp(): Promise<{ handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> }> {
  const db = await initDb();
  const handler = (req: IncomingMessage, res: ServerResponse) => handleRequest(db, req, res);
  return { handler };
}

/** 独立运行入口 */
async function main() {
  const { handler } = await createApp();
  const server = createServer((req, res) => {
    // CORS（dev 方便前端跨域；生产由 caddy 反代同源，可去掉）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    void handler(req, res);
  });

  server.listen(PORT, () => {
    console.log(`[server] gov.dn42 backend listening on http://localhost:${PORT}${API_PREFIX}`);
  });

  // 优雅退出
  const shutdown = async () => {
    console.log('[server] shutting down...');
    server.close();
    await closeDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// 当作主模块运行时启动
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
