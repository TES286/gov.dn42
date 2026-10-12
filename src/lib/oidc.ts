/**
 * gov.dn42 OIDC 身份认证对接层
 *
 * 子域名注册等需实名身份的在线服务，以 DN42 社区内部 OIDC 为前置认证。
 * 三个发现端点（见 issue #4 评论）：
 *  - https://auth.iedon.net/.well-known/openid-configuration
 *  - https://dn42.g-load.eu/.well-known/openid-configuration
 *  - https://auth42.hexpnet.work/.well-known/openid-configuration
 *
 * 采用 Authorization Code（常规 client_secret）流程：client_id + client_secret
 * 由后端持有（见 server/），前端只发起授权并传 code 到后端回调。
 *
 * 管理员限定：OIDC 返回的 `dn42` 声明中 ASN 为 4242420078 的用户为管理员
 * （见 issue #4 评论 3.1）。
 */

/** OIDC 提供商配置 */
export interface OidcProvider {
  /** 提供商标识 */
  id: string;
  /** 发现文档 URL */
  discoveryUrl: string;
  /** 授权端点 */
  authorizationEndpoint: string;
  /** token 端点（后端用于换 token） */
  tokenEndpoint: string;
  /** userinfo 端点 */
  userinfoEndpoint?: string;
  /** issuer */
  issuer: string;
  /** 展示名 */
  displayName: string;
}

/** 内置 OIDC 提供商（发现文档关键端点已预解析） */
export const OIDC_PROVIDERS: OidcProvider[] = [
  {
    id: 'iedon',
    discoveryUrl: 'https://auth.iedon.net/.well-known/openid-configuration',
    authorizationEndpoint: 'https://auth.iedon.net/authorize',
    tokenEndpoint: 'https://auth.iedon.net/token',
    issuer: 'https://auth.iedon.net',
    displayName: 'OAuth.dn42',
  },
  {
    id: 'g-load',
    discoveryUrl: 'https://dn42.g-load.eu/.well-known/openid-configuration',
    authorizationEndpoint: 'https://dn42.g-load.eu/oauth2/auth',
    tokenEndpoint: 'https://dn42.g-load.eu/oauth2/token',
    userinfoEndpoint: 'https://dn42.g-load.eu/oauth2/userinfo',
    issuer: 'https://dn42.g-load.eu',
    displayName: 'Kioubit.dn42 Auth',
  },
  {
    id: 'hexpnet',
    discoveryUrl: 'https://auth42.hexpnet.work/.well-known/openid-configuration',
    authorizationEndpoint: 'https://auth42.hexpnet.work/auth/oauth/authorize',
    tokenEndpoint: 'https://auth42.hexpnet.work/auth/oauth/token',
    userinfoEndpoint: 'https://auth42.hexpnet.work/auth/oauth/userinfo',
    issuer: 'https://auth42.hexpnet.work',
    displayName: 'HExpNetwork WebAuth',
  },
];

/** 请求的 scope：openid + profile + email + dn42（DN42 社区专属声明，含 ASN） */
export const OIDC_SCOPE = 'openid profile email dn42';

/** 管理员 ASN：4242420078 的所有者为管理员 */
export const ADMIN_ASN = '4242420078';

/** client_id：owner 硬编码（生产建议改为构建期注入） */
function clientIdFor(providerId: string): string {
  if (providerId === 'iedon') {
    return '74f53c92f6039374ecc1981d59b0be70';
  } else if (providerId === 'g-load') {
    return 'cbb31e4f-af83-4df7-b362-1b50ab1c6607';
  } else if (providerId === 'hexpnet') {
    return 'XmR1nNxHU17snGVi';
  } else {
    return '';
  }
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

/** 认证会话上下文（发起授权前暂存，回调时校验 state） */
export interface OidcAuthSession {
  providerId: string;
  state: string;
  /** 发起时间，用于超时清理 */
  startedAt: number;
}

const SESSION_KEY = 'gov-dn42-oidc-session';

/** 保存会话到 sessionStorage（回调页消费后清除） */
export function saveOidcSession(session: OidcAuthSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** 读取并移除会话 */
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

/** 已认证用户信息（回调后由后端换取 token 后回传） */
export interface OidcUser {
  providerId: string;
  /** subject identifier */
  sub: string;
  /** 显示名 */
  name?: string;
  /** 邮箱 */
  email?: string;
  /** DN42 社区标识，含 ASN（如 "AS4242420078"） */
  dn42?: string;
  /** 是否管理员（dn42 中 ASN = 4242420078） */
  isAdmin?: boolean;
  /** 后端下发的会话 token，用于后续 API 鉴权 */
  token?: string;
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

/** 构造授权 URL 并重定向到 OIDC 提供商
 *  常规 Authorization Code 流程：client_secret 由后端持有，
 *  前端只发起授权请求，code 在回调页交给后端换 token。 */
export function redirectToAuthorize(provider: OidcProvider): void {
  const clientId = clientIdFor(provider.id);
  if (!clientId) {
    throw new Error(`OIDC client_id for ${provider.id} is not configured.`);
  }

  const state = generateState();
  const redirectUri = `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`;

  saveOidcSession({
    providerId: provider.id,
    state,
    startedAt: Date.now(),
  });

  const url = new URL(provider.authorizationEndpoint);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', OIDC_SCOPE);
  url.searchParams.set('state', state);

  window.location.assign(url.toString());
}
