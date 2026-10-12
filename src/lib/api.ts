/**
 * gov.dn42 在线服务 API 对接层
 *
 * 接口契约见 docs/api.md。默认指向同源 /api/v1，
 * 后端未部署时调用方应通过 isServiceUnavailable() 识别并优雅降级。
 */

/** API 基础地址：可通过 VITE_API_BASE 环境变量覆盖 */
const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api/v1'

export interface AvailabilityResult {
  name: string
  available: boolean
  reason?: string
}

export interface RegistrationPayload {
  name: string
  purpose: string
  ipv4?: string
  ipv6?: string
  contact: string
  note?: string
  agree: true
}

export interface RegistrationReceipt {
  id: string
  name: string
  status: 'pending' | 'approved' | 'rejected'
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers, ...rest } = init ?? {}

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: { Accept: 'application/json', ...headers },
    })
  } catch {
    throw new ApiError('无法连接注册服务', 0, 'NETWORK_ERROR')
  }

  if (!response.ok) {
    let code = 'HTTP_ERROR'
    let message = `注册服务返回错误（${response.status}）`
    try {
      const data = (await response.json()) as {
        error?: { code?: string; message?: string }
      }
      if (data.error?.code) code = data.error.code
      if (data.error?.message) message = data.error.message
    } catch {
      // 响应体不是 JSON，保留默认错误信息
    }
    throw new ApiError(message, response.status, code)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

/** 判断错误是否因"后端尚未部署"导致（网络失败 / 404 / 405 / 5xx） */
export function isServiceUnavailable(error: unknown): boolean {
  if (error instanceof ApiError) {
    return (
      error.status === 0 ||
      error.status === 404 ||
      error.status === 405 ||
      error.status >= 500
    )
  }
  return false
}

/** 子域名注册服务接口 */
export const subdomainApi = {
  /** 查询子域名可用性 */
  availability: (name: string) =>
    request<AvailabilityResult>(
      `/subdomains/availability?name=${encodeURIComponent(name)}`,
    ),

  /** 提交子域名注册申请 */
  register: (payload: RegistrationPayload) =>
    request<RegistrationReceipt>('/subdomains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
}
