export interface Department {
  name: { zh: string; en: string };
  duty: { zh: string; en: string };
}

/** 政府组成部门（虚构设定） */
export const departments: Department[] = [
  {
    name: { zh: '办公厅', en: 'General Office' },
    duty: {
      zh: '负责综合协调、文电运转、政务公开与政府门户网站管理。',
      en: 'Coordinates overall operations, document handling, government transparency and the portal.',
    },
  },
  {
    name: { zh: '网络资源管理局', en: 'Network Resources Authority' },
    duty: {
      zh: '统筹 .dn42 子域名、IP 地址段与自治系统号（ASN）等网络资源的分配与管理。',
      en: 'Allocates and manages .dn42 subdomains, IP prefixes and autonomous system numbers (ASN).',
    },
  },
  {
    name: { zh: '路由事务部', en: 'Routing Affairs Department' },
    duty: {
      zh: '拟订路由政策，协调对等互联事务，维护网络互联互通与稳定运行。',
      en: 'Sets routing policy, coordinates peering and maintains network interconnection and stability.',
    },
  },
  {
    name: { zh: '社区事务部', en: 'Community Affairs Department' },
    duty: {
      zh: '组织社区活动，管理公共服务渠道，促进公民参与与网络文化传播。',
      en: 'Organises community events, manages public service channels and promotes civic participation.',
    },
  },
  {
    name: { zh: '标准与技术委员会', en: 'Standards and Technology Committee' },
    duty: {
      zh: '负责技术规范的起草、审查与推广，跟踪协议与基础设施演进。',
      en: 'Drafts, reviews and promotes technical standards; tracks protocol and infrastructure evolution.',
    },
  },
  {
    name: { zh: '资源与纠纷调解委员会', en: 'Resources and Dispute Mediation Committee' },
    duty: {
      zh: '受理网络资源争议，组织调解与仲裁，维护资源分配秩序。',
      en: 'Handles network resource disputes, organises mediation and arbitration, and upholds allocation order.',
    },
  },
];
