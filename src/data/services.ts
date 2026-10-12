export type ServiceStatus = 'available' | 'guide' | 'planned'

export interface ServiceItem {
  name: string
  desc: string
  status: ServiceStatus
  /** 站内路由 */
  to?: string
  /** 站外链接 */
  href?: string
}

export const STATUS_META: Record<ServiceStatus, { label: string; className: string }> = {
  available: { label: '可办理', className: 'tag--ok' },
  guide: { label: '办事指引', className: 'tag--info' },
  planned: { label: '建设中', className: 'tag--plan' },
}

/** 公民服务目录 */
export const services: ServiceItem[] = [
  {
    name: '子域名注册',
    desc: '在线申请专属 .dn42 子域名，并将其解析至您的网络资源。',
    status: 'available',
    to: '/services/subdomain',
  },
  {
    name: 'ASN 与 IP 资源申请指引',
    desc: '了解自治系统号与地址段资源在 DN42 网络中的标准申请流程。',
    status: 'guide',
    href: 'https://dn42.dev',
  },
  {
    name: '政务信息公开',
    desc: '查阅政府政策文件、规章草案与信息公开目录。',
    status: 'available',
    to: '/policy',
  },
  {
    name: '网络接入指引',
    desc: '初次接触 DN42？从官方 Wiki 开始了解如何加入网络。',
    status: 'guide',
    href: 'https://dn42.dev',
  },
  {
    name: 'Whois 信息查询',
    desc: '查询网络资源的注册信息与托管状态。',
    status: 'planned',
  },
  {
    name: '资源纠纷调解申请',
    desc: '就网络资源争议在线提交调解申请。',
    status: 'planned',
  },
]
