export type PolicyStatus = 'active' | 'consultation' | 'drafting';

export interface PolicyDoc {
  title: { zh: string; en: string };
  org: { zh: string; en: string };
  date: string;
  status: PolicyStatus;
  summary: { zh: string; en: string };
}

/** 状态元数据：labelKey 对应 i18n 键 policy.status{Key} */
export const POLICY_STATUS_META: Record<PolicyStatus, { labelKey: 'Active' | 'Consultation' | 'Drafting'; className: string }> = {
  active: { labelKey: 'Active', className: 'tag--ok' },
  consultation: { labelKey: 'Consultation', className: 'tag--info' },
  drafting: { labelKey: 'Drafting', className: 'tag--plan' },
};

/** 政策法规文件目录 */
export const policies: PolicyDoc[] = [
  {
    title: {
      zh: '《DN42 联合自治政府组织章程（试行）》',
      en: 'Constitution of the DN42 United Autonomous Government (Trial)',
    },
    org: { zh: '政府委员会', en: 'Government Committee' },
    date: '2026-08-01',
    status: 'active',
    summary: {
      zh: '规定政府的性质定位、机构设置、议事规则与成员产生方式，是政府运作的总章程。',
      en: 'Defines the nature, structure, rules of procedure and membership of the Government — the governing constitution.',
    },
  },
  {
    title: {
      zh: '《子域名分配管理办法（试行·征求意见稿）》',
      en: 'Subdomain Allocation Measures (Trial · Consultation draft)',
    },
    org: { zh: '网络资源管理局', en: 'Network Resources Authority' },
    date: '2026-09-28',
    status: 'consultation',
    summary: {
      zh: '规范 .dn42 子域名资源的分配、使用、回收与争议处理，征求意见截止 2026 年 10 月 31 日。',
      en: 'Regulates the allocation, use, recovery and dispute resolution of .dn42 subdomains; comments open until 31 October 2026.',
    },
  },
  {
    title: {
      zh: '《政府信息公开办法》',
      en: 'Government Information Disclosure Measures',
    },
    org: { zh: '办公厅', en: 'General Office' },
    date: '2026-08-15',
    status: 'active',
    summary: {
      zh: '明确政务信息公开的范围、方式、时限与监督途径，保障公民的知情权与监督权。',
      en: 'Defines the scope, means, deadlines and oversight of government information disclosure, safeguarding citizens’ right to know and to supervise.',
    },
  },
  {
    title: {
      zh: '《网络资源争议调解程序规则（草案）》',
      en: 'Rules on Network Resource Dispute Mediation Procedure (Draft)',
    },
    org: { zh: '资源与纠纷调解委员会', en: 'Resources and Dispute Mediation Committee' },
    date: '2026-09-05',
    status: 'drafting',
    summary: {
      zh: '规定资源争议调解的申请受理、调解程序、协议效力与执行跟进等事项。',
      en: 'Covers the application, mediation procedure, agreement effect and enforcement follow-up for resource disputes.',
    },
  },
];
