/**
 * gov.dn42 在线服务 API 对接层
 *
 * 接口契约见 docs/api.md。默认指向同源 /api/v1，
 * 后端未部署时调用方应通过 isServiceUnavailable() 识别并优雅降级。
 */

/** API 基础地址：可通过 VITE_API_BASE 环境变量覆盖 */
const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api/v1';

export interface AvailabilityResult {
  name: string;
  available: boolean;
  reason?: string;
}

export interface RegistrationPayload {
  name: string;
  purpose: string;
  /** NS 记录列表，至少 2 个名称服务器 */
  ns: string[];
  /** DS 记录列表（DNSSEC，可选） */
  ds?: string[];
  contact: string;
  note?: string;
  agree: true;
  /** 已认证用户标识；后端凭此核验申请人身份 */
  auth?: {
    providerId: string;
    sub: string;
  };
}

export interface RegistrationReceipt {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
}

/** 子域名申请详情（查询接口与管理员列表返回） */
export interface SubdomainApplication {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  ns: string[];
  ds?: string[];
  purpose: string;
  contact: string;
  note?: string;
  auth?: { providerId: string; sub: string };
  createdAt: string;
  /** 驳回时附原因 */
  reason?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers, ...rest } = init ?? {};

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: { Accept: 'application/json', ...headers },
    });
  } catch {
    throw new ApiError('无法连接注册服务', 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    let code = 'HTTP_ERROR';
    let message = `注册服务返回错误（${response.status}）`;
    try {
      const data = (await response.json()) as {
        error?: { code?: string; message?: string };
      };
      if (data.error?.code) code = data.error.code;
      if (data.error?.message) message = data.error.message;
    } catch {
      // 响应体不是 JSON，保留默认错误信息
    }
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** 判断错误是否因"后端尚未部署"导致（网络失败 / 404 / 405 / 5xx） */
export function isServiceUnavailable(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 0 || error.status === 404 || error.status === 405 || error.status >= 500;
  }
  return false;
}

/** 子域名注册服务接口 */
export const subdomainApi = {
  /** 查询子域名可用性 */
  availability: (name: string) => request<AvailabilityResult>(`/subdomains/availability?name=${encodeURIComponent(name)}`),

  /** 提交子域名注册申请 */
  register: (payload: RegistrationPayload) =>
    request<RegistrationReceipt>('/subdomains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  /** 查询申请进度 */
  get: (id: string) => request<SubdomainApplication>(`/subdomains/${encodeURIComponent(id)}`),
};

/* ============================================================
   管理员接口（mock 阶段不鉴权）
   ============================================================ */

export interface AdminSubdomainList {
  items: SubdomainApplication[];
}

export const adminApi = {
  /** 列出全部申请（可按状态过滤） */
  list: (status?: 'pending' | 'approved' | 'rejected') =>
    request<AdminSubdomainList>(`/admin/subdomains${status ? `?status=${status}` : ''}`),

  /** 审批通过 */
  approve: (id: string) =>
    request<RegistrationReceipt>(`/admin/subdomains/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    }),

  /** 驳回 */
  reject: (id: string, reason: string) =>
    request<RegistrationReceipt>(`/admin/subdomains/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),
};

/* ============================================================
   举报与意见箱提交接口
   举报与意见均写入后端日志留档（详见 docs/api.md）。
   ============================================================ */

export type SubmissionType = 'report' | 'feedback';

export interface SubmissionPayload {
  type: SubmissionType;
  category: string;
  content: string;
  target?: string;
  contact?: string;
}

export interface SubmissionReceipt {
  id: string;
  type: SubmissionType;
  status: 'received';
}

/** 举报 / 意见箱服务接口 */
export const submissionsApi = {
  /** 提交举报或意见 */
  submit: (payload: SubmissionPayload) =>
    request<SubmissionReceipt>('/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};

/* ============================================================
   OIDC 身份认证接口
   前端完成 Authorization Code + PKCE 重定向后，回调页将 code 交由后端
   换取 token 并校验，后端回传已认证用户信息。
   ============================================================ */

export interface OidcCallbackPayload {
  providerId: string;
  code: string;
  /** PKCE code_verifier，由后端用于换取 token */
  codeVerifier: string;
  /** 授权重定向地址，供后端校验 */
  redirectUri: string;
}

export interface OidcAuthResult {
  user: {
    providerId: string;
    sub: string;
    name?: string;
    email?: string;
    dn42?: string;
  };
}

/** OIDC 认证接口 */
export const authApi = {
  /** 用授权码换取已认证用户信息（后端完成 token 交换与 ID token 校验） */
  callback: (payload: OidcCallbackPayload) =>
    request<OidcAuthResult>('/auth/oidc/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};
