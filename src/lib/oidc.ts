/**
 * gov.dn42 OIDC 身份认证对接层
 *
 * 子域名注册等需实名身份的在线服务，以 DN42 社区内部 OIDC 为前置认证。
 * 三个发现端点（见 issue #4 评论）：
 *  - https://auth.iedon.net/.well-known/openid-configuration
 *  - https://dn42.g-load.eu/.well-known/openid-configuration
 *  - https://auth42.hexpnet.work/.well-known/openid-configuration
 *
 * 采用 Authorization Code + PKCE 流程，无需 client_secret，
 * 适合静态 SPA 部署。token 交换与校验由后端在提交时完成。
 */

/** OIDC 提供商配置 */
export interface OidcProvider {
  /** 提供商标识 */
  id: string;
  /** 发现文档 URL */
  discoveryUrl: string;
  /** 授权端点（从发现文档解析） */
  authorizationEndpoint: string;
  /** token 端点（从发现文档解析） */
  tokenEndpoint: string;
  /** userinfo 端点（从发现文档解析） */
  userinfoEndpoint?: string;
  /** issuer */
  issuer: string;
  /** 展示名 */
  displayName: string;
}

/** 内置 OIDC 提供商（发现文档关键端点已预解析，避免运行时抓取） */
export const OIDC_PROVIDERS: OidcProvider[] = [
  {
    id: 'iedon',
    discoveryUrl: 'https://auth.iedon.net/.well-known/openid-configuration',
    authorizationEndpoint: 'https://auth.iedon.net/authorize',
    tokenEndpoint: 'https://auth.iedon.net/token',
    issuer: 'https://auth.iedon.net',
    displayName: 'iedon.net Auth',
  },
  {
    id: 'g-load',
    discoveryUrl: 'https://dn42.g-load.eu/.well-known/openid-configuration',
    authorizationEndpoint: 'https://dn42.g-load.eu/oauth2/auth',
    tokenEndpoint: 'https://dn42.g-load.eu/oauth2/token',
    userinfoEndpoint: 'https://dn42.g-load.eu/oauth2/userinfo',
    issuer: 'https://dn42.g-load.eu',
    displayName: 'g-load.eu Auth',
  },
  {
    id: 'hexpnet',
    discoveryUrl: 'https://auth42.hexpnet.work/.well-known/openid-configuration',
    authorizationEndpoint: 'https://auth42.hexpnet.work/auth/oauth/authorize',
    tokenEndpoint: 'https://auth42.hexpnet.work/auth/oauth/token',
    userinfoEndpoint: 'https://auth42.hexpnet.work/auth/oauth/userinfo',
    issuer: 'https://auth42.hexpnet.work',
    displayName: 'hexpnet.work Auth',
  },
];

/** 请求的 scope：openid + profile + email + dn42（DN42 社区专属声明） */
export const OIDC_SCOPE = 'openid profile email dn42';

/** client_id 通过环境变量配置（每个提供商各一个）；未配置时为空字符串 */
function clientIdFor(providerId: string): string {
  const key = `VITE_OIDC_CLIENT_ID_${providerId.toUpperCase().replace(/-/g, '_')}`;
  return (import.meta.env[key] as string | undefined) ?? '';
}

/** PKCE code_verifier：43-128 字符的 URL 安全随机串 */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

/** PKCE code_challenge：base64url(SHA256(verifier))，method=S256 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64url(new Uint8Array(digest));
}

/** 随机 state（CSRF 防护） */
export function generateState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

/** base64url 编码 */
function base64url(bytes: Uint8Array): string {
  const str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** 认证会话上下文（发起授权前暂存，回调时校验） */
export interface OidcAuthSession {
  providerId: string;
  codeVerifier: string;
  state: string;
  /** 发起时间，用于超时清理 */
  startedAt: number;
}

const SESSION_KEY = 'gov-dn42-oidc-session';

/** 保存 PKCE 会话到 sessionStorage（回调页消费后清除） */
export function saveOidcSession(session: OidcAuthSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** 读取并移除 PKCE 会话 */
export function consumeOidcSession(): OidcAuthSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(SESSION_KEY);
  try {
    return JSON.parse(raw) as OidcAuthSession;
  } catch {
    return null;
  }
}

/** 已认证用户信息（回调后由后端换取 token 后回传；框架阶段先存 claim 摘要） */
export interface OidcUser {
  providerId: string;
  /** subject identifier */
  sub: string;
  /** 显示名 */
  name?: string;
  /** 邮箱 */
  email?: string;
  /** DN42 社区标识 */
  dn42?: string;
}

const USER_KEY = 'gov-dn42-oidc-user';

/** 保存已认证用户到 localStorage */
export function saveOidcUser(user: OidcUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** 读取已认证用户 */
export function loadOidcUser(): OidcUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as OidcUser) : null;
  } catch {
    return null;
  }
}

/** 清除已认证用户 */
export function clearOidcUser(): void {
  localStorage.removeItem(USER_KEY);
}

/** 构造授权 URL 并重定向到 OIDC 提供商 */
export async function redirectToAuthorize(provider: OidcProvider): Promise<void> {
  const clientId = clientIdFor(provider.id);
  if (!clientId) {
    throw new Error(`OIDC client_id for ${provider.id} is not configured. Set VITE_OIDC_CLIENT_ID_${provider.id.toUpperCase().replace(/-/g, '_')}.`);
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  const redirectUri = `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`;

  saveOidcSession({
    providerId: provider.id,
    codeVerifier,
    state,
    startedAt: Date.now(),
  });

  const url = new URL(provider.authorizationEndpoint);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', OIDC_SCOPE);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);

  window.location.assign(url.toString());
}
