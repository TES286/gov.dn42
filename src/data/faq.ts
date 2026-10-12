export interface FaqEntry {
  question: { zh: string; en: string };
  answer: { zh: string; en: string };
}

/** 公民常见问题 */
export const faqs: FaqEntry[] = [
  {
    question: { zh: '如何获得一个 .dn42 子域名？', en: 'How do I get a .dn42 subdomain?' },
    answer: {
      zh: '前往“公民服务—子域名注册”页面在线提交申请。申请免费，遵循先到先得原则，经网络资源管理局人工审核通过后即可完成解析。目前该服务处于试运行阶段。',
      en: 'Submit an application online at “Services — Subdomain registration”. Applications are free and allocated first-come, first-served; after manual review by the Network Resources Authority, resolution is configured. The service is currently in trial.',
    },
  },
  {
    question: { zh: '子域名注册需要收费吗？', en: 'Is there a fee for subdomain registration?' },
    answer: {
      zh: '不需要。依据《子域名分配管理办法（试行）》，子域名免费分配，政府不会以任何名义收取费用。如遇收费情形，请通过“联系我们”反映。',
      en: 'No. Under the Subdomain Allocation Measures (Trial), subdomains are allocated free of charge. The Government will never collect any fee. If asked to pay, please report it via “Contact us”.',
    },
  },
  {
    question: {
      zh: '我还没有接入 DN42 网络，可以先注册子域名吗？',
      en: 'Can I register a subdomain before joining the DN42 network?',
    },
    answer: {
      zh: '建议先接入网络。子域名用于解析 DN42 网络内的资源，需要您在网内拥有可用的地址空间。如何加入网络，请参阅 DN42 官方 Wiki（dn42.dev）的入门指引。',
      en: 'Please join the network first. A subdomain resolves to resources on the DN42 network, so you need usable address space within it. See the DN42 Wiki (dn42.dev) for how to join.',
    },
  },
  {
    question: { zh: 'ASN 和 IP 地址段如何申请？', en: 'How do I apply for an ASN or IP prefix?' },
    answer: {
      zh: 'ASN 与 IP 地址段通过 DN42 Registry 流程分配，不属于政府直接办理事项。政府提供标准流程的办事指引，具体请参见官方 Wiki 与 Registry 仓库。',
      en: 'ASNs and IP prefixes are allocated through the DN42 Registry process and are not handled directly by the Government. We provide standard process guidance — see the official Wiki and the Registry repository.',
    },
  },
  {
    question: { zh: '如何参与政府工作或提出建议？', en: 'How can I take part or give feedback?' },
    answer: {
      zh: '政府网站与全部政策草案均以开源方式运作，欢迎通过源代码仓库提交 Issue 与 Pull Request，参与政策讨论、内容纠错与界面改进。',
      en: 'The website and all policy drafts are run openly. Please submit Issues and Pull Requests via the source repository to join policy discussion, correct content or improve the interface.',
    },
  },
];
