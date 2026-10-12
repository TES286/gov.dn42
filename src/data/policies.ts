export type PolicyStatus = 'active' | 'consultation' | 'drafting'

export interface PolicyDoc {
  title: string
  org: string
  date: string
  status: PolicyStatus
  summary: string
}

export const POLICY_STATUS_META: Record<PolicyStatus, { label: string; className: string }> = {
  active: { label: '现行有效', className: 'tag--ok' },
  consultation: { label: '征求意见中', className: 'tag--info' },
  drafting: { label: '起草中', className: 'tag--plan' },
}

/** 政策法规文件目录 */
export const policies: PolicyDoc[] = [
  {
    title: '《DN42 联合自治政府组织章程（试行）》',
    org: '政府委员会',
    date: '2026-08-01',
    status: 'active',
    summary: '规定政府的性质定位、机构设置、议事规则与成员产生方式，是政府运作的总章程。',
  },
  {
    title: '《子域名分配管理办法（试行·征求意见稿）》',
    org: '网络资源管理局',
    date: '2026-09-28',
    status: 'consultation',
    summary:
      '规范 .dn42 子域名资源的分配、使用、回收与争议处理，征求意见截止 2026 年 10 月 31 日。',
  },
  {
    title: '《政府信息公开办法》',
    org: '办公厅',
    date: '2026-08-15',
    status: 'active',
    summary: '明确政务信息公开的范围、方式、时限与监督途径，保障公民的知情权与监督权。',
  },
  {
    title: '《网络资源争议调解程序规则（草案）》',
    org: '资源与纠纷调解委员会',
    date: '2026-09-05',
    status: 'drafting',
    summary: '规定资源争议调解的申请受理、调解程序、协议效力与执行跟进等事项。',
  },
]
