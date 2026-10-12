import { Breadcrumb } from '../components/layout/Breadcrumb'
import { usePageTitle } from '../lib/usePageTitle'

const CHANNELS = [
  {
    name: '电子政务邮箱',
    value: 'gov@dn42',
    desc: '用于一般咨询、意见建议与政务信息公开申请。该邮箱位于虚拟顶级域，仅 DN42 网络内可达。',
  },
  {
    name: '社区频道',
    value: '#dn42-gov @ irc.hackint.org',
    desc: '即时讨论与公众咨询渠道，工作时段（虚拟时间）均有工作人员值守。',
  },
  {
    name: '源代码仓库',
    value: 'github.com/TES286/gov.dn42',
    href: 'https://github.com/TES286/gov.dn42/issues',
    desc: '问题反馈与参与共建的首选渠道，全部issue公开可见、可跟踪。',
  },
]

export default function ContactPage() {
  usePageTitle('联系我们')

  return (
    <>
      <div className="page-head">
        <div className="container">
          <Breadcrumb items={[{ label: '联系我们' }]} />
          <h1>联系我们</h1>
          <p className="page-head__sub">
            通过以下渠道与政府各部门取得联系，咨询、建议与监督同样欢迎。
          </p>
        </div>
      </div>

      <div className="container page-body">
        <div className="contact-grid">
          {CHANNELS.map((channel) => (
            <div key={channel.name} className="contact-card">
              <h3>{channel.name}</h3>
              {channel.href ? (
                <a className="contact-card__value" href={channel.href} target="_blank" rel="noreferrer">
                  {channel.value}
                </a>
              ) : (
                <span className="contact-card__value">{channel.value}</span>
              )}
              <p>{channel.desc}</p>
            </div>
          ))}
        </div>

        <div className="callout callout--gold callout--spaced">
          <p>
            <strong>答复时限：</strong>
            对通过上述渠道提出的事项，政府将在 5 个工作日内予以答复（虚拟工作时间）；
            涉及网络资源争议的，将转交资源与纠纷调解委员会依程序办理。
          </p>
        </div>
      </div>
    </>
  )
}
