export interface Department {
  name: string
  duty: string
}

/** 政府组成部门（虚构设定） */
export const departments: Department[] = [
  { name: '办公厅', duty: '负责综合协调、文电运转、政务公开与政府门户网站管理。' },
  {
    name: '网络资源管理局',
    duty: '统筹 .dn42 子域名、IP 地址段与自治系统号（ASN）等网络资源的分配与管理。',
  },
  {
    name: '路由事务部',
    duty: '拟订路由政策，协调对等互联事务，维护网络互联互通与稳定运行。',
  },
  {
    name: '社区事务部',
    duty: '组织社区活动，管理公共服务渠道，促进公民参与与网络文化传播。',
  },
  {
    name: '标准与技术委员会',
    duty: '负责技术规范的起草、审查与推广，跟踪协议与基础设施演进。',
  },
  {
    name: '资源与纠纷调解委员会',
    duty: '受理网络资源争议，组织调解与仲裁，维护资源分配秩序。',
  },
]
