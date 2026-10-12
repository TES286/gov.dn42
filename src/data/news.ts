export interface NewsItem {
  slug: string;
  date: string;
  org: { zh: string; en: string };
  title: { zh: string; en: string };
  summary: { zh: string; en: string };
  /** 正文是否已发布；未发布时仅展示摘要 */
  published: boolean;
  body?: { zh: string[]; en: string[] };
}

/** 新闻公告数据 */
export const newsItems: NewsItem[] = [
  {
    slug: 'portal-online-trial',
    date: '2026-10-10',
    org: { zh: '办公厅', en: 'General Office' },
    title: {
      zh: '关于政府门户网站上线试运行的公告',
      en: 'Announcement on the trial launch of the government portal',
    },
    summary: {
      zh: 'DN42 联合自治政府门户网站正式上线试运行，子域名注册等在线服务将陆续开放。',
      en: 'The DN42 United Autonomous Government portal is now in trial operation; subdomain registration and other online services will open progressively.',
    },
    published: true,
    body: {
      zh: [
        '为进一步推进 DN42 网络社区的公共治理实践，提升政务信息公开与公共服务水平，“DN42 联合自治政府”门户网站（gov.dn42）已于 2026 年 10 月 10 日起上线试运行。',
        '门户网站首批开通以下栏目：政府概况、新闻公告、公民服务、政务公开、常见问题、联系我们与法律声明。其中，子域名注册在线申请功能已完成前端建设，正在与后端注册服务进行联调，将按计划陆续向全体公民开放。',
        '试运行期间，网站部分功能可能发生变化，页面样式与栏目设置将根据公民反馈持续优化。如在使用过程中发现问题，或对网站建设有意见建议，欢迎通过源代码仓库的 Issue 功能或“联系我们”页面公布的渠道反馈。',
        '感谢广大网络公民对政府工作的关心与支持。',
      ],
      en: [
        'To further public governance practice in the DN42 community and improve transparency and public services, the portal of the DN42 United Autonomous Government (gov.dn42) entered trial operation on 10 October 2026.',
        'The portal opens with the following sections: About the government, News and announcements, Citizen services, Policy, FAQ, Contact us, and Legal. The subdomain registration application frontend is complete; it is being integrated with the backend registration service and will open to all citizens on schedule.',
        'During the trial, some features may change, and layout and sections will be refined based on feedback. If you encounter problems or have suggestions, please use the source repository’s Issues or the channels on the Contact us page.',
        'Thank you for your interest in and support for the government’s work.',
      ],
    },
  },
  {
    slug: 'subdomain-measures-draft',
    date: '2026-09-28',
    org: { zh: '网络资源管理局', en: 'Network Resources Authority' },
    title: {
      zh: '《子域名分配管理办法（试行）》公开征求意见',
      en: 'Subdomain Allocation Measures (Trial) — open for public comment',
    },
    summary: {
      zh: '为规范 .dn42 子域名资源的分配与使用，现就管理办法（试行）向全体公民公开征求意见。',
      en: 'To regulate the allocation and use of .dn42 subdomain resources, the Trial Measures are now open for comment from all citizens.',
    },
    published: true,
    body: {
      zh: [
        '为规范 .dn42 子域名资源的分配与使用秩序，保障网络公民的合法权益，网络资源管理局起草了《子域名分配管理办法（试行）》（征求意见稿），现向社会公开征求意见。',
        '有关单位和个人可以在 2026 年 10 月 31 日前，通过政府源代码仓库提交意见。',
        '征求意见稿的主要内容包括：一是明确子域名免费分配、先到先得的基本原则；二是规定子域名的命名规则与保留字制度；三是确立实名联系与违规退出机制；四是明确资源回收与争议处理程序。',
        '我们将认真研究各方意见，在进一步修改完善后发布试行版本。',
      ],
      en: [
        'To regulate the allocation and use of .dn42 subdomain resources and protect citizens’ legitimate rights, the Network Resources Authority has drafted the Subdomain Allocation Measures (Trial) (consultation draft) and now invites public comment.',
        'Interested parties may submit comments via the government source repository by 31 October 2026.',
        'The draft covers: (1) the free, first-come, first-served principle; (2) naming rules and reserved names; (3) verifiable contact details and an exit mechanism for violations; (4) resource recovery and dispute resolution procedures.',
        'All feedback will be carefully considered before the trial edition is finalised and published.',
      ],
    },
  },
  {
    slug: 'resource-survey-q3',
    date: '2026-09-15',
    org: { zh: '网络资源管理局', en: 'Network Resources Authority' },
    title: {
      zh: '关于开展第三季度网络资源普查的通知',
      en: 'Notice on the Q3 network resource survey',
    },
    summary: {
      zh: '定于 9 月 20 日至 10 月 20 日开展第三季度网络资源普查工作，全面摸排 ASN 与地址段使用情况。',
      en: 'From 20 September to 20 October, a Q3 network resource survey will audit ASN and address prefix usage.',
    },
    published: false,
  },
];
