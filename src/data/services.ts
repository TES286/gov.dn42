export type ServiceStatus = 'available' | 'guide' | 'planned';

export interface ServiceItem {
  name: { zh: string; en: string };
  desc: { zh: string; en: string };
  status: ServiceStatus;
  /** 站内路由 */
  to?: string;
  /** 站外链接 */
  href?: string;
}

/** 状态元数据：labelKey 对应 i18n 键 services.status{Key} */
export const STATUS_META: Record<ServiceStatus, { labelKey: 'Available' | 'Guide' | 'Planned'; className: string }> = {
  available: { labelKey: 'Available', className: 'tag--ok' },
  guide: { labelKey: 'Guide', className: 'tag--info' },
  planned: { labelKey: 'Planned', className: 'tag--plan' },
};

/** 公民服务目录 */
export const services: ServiceItem[] = [
  {
    name: { zh: '子域名注册', en: 'Subdomain registration' },
    desc: {
      zh: '在线申请专属 .dn42 子域名，并将其解析至您的网络资源。',
      en: 'Apply online for a .dn42 subdomain and have it resolve to your network resources.',
    },
    status: 'available',
    to: '/services/subdomain',
  },
  {
    name: { zh: 'ASN 与 IP 资源申请指引', en: 'ASN and IP resource guidance' },
    desc: {
      zh: '了解自治系统号与地址段资源在 DN42 网络中的标准申请流程。',
      en: 'The standard process for autonomous system numbers and address prefixes on DN42.',
    },
    status: 'guide',
    href: 'https://dn42.dev',
  },
  {
    name: { zh: '政务信息公开', en: 'Government information disclosure' },
    desc: {
      zh: '查阅政府政策文件、规章草案与信息公开目录。',
      en: 'Browse government policy documents, draft regulations and the disclosure catalogue.',
    },
    status: 'available',
    to: '/policy',
  },
  {
    name: { zh: '网络接入指引', en: 'Network onboarding guide' },
    desc: {
      zh: '初次接触 DN42？从官方 Wiki 开始了解如何加入网络。',
      en: 'New to DN42? Start with the official Wiki to join the network.',
    },
    status: 'guide',
    href: 'https://dn42.dev',
  },
  {
    name: { zh: 'Whois 信息查询', en: 'Whois lookup' },
    desc: {
      zh: '查询网络资源的注册信息与托管状态。',
      en: 'Look up registration information and hosting status of network resources.',
    },
    status: 'planned',
  },
  {
    name: { zh: '资源纠纷调解申请', en: 'Resource dispute mediation' },
    desc: {
      zh: '就网络资源争议在线提交调解申请。',
      en: 'File an online mediation request for a network resource dispute.',
    },
    status: 'planned',
  },
];
