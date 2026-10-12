/** 阶段横幅（Phase Banner）
 *  对齐 GOV.UK Design System 的 phase-banner 组件：
 *  阶段标签 + 一句服务说明，置于主内容之上。
 */
export function NoticeBar() {
  return (
    <div className='phase-banner'>
      <div className='container phase-banner__inner'>
        <span className='phase-banner__tag'>试用版</span>
        <span className='phase-banner__text'>
          本门户网站为新上线服务，部分功能仍在完善中。如在使用过程中发现问题，欢迎通过
          <a href='https://github.com/TES286/gov.dn42' target='_blank' rel='noreferrer'>
            源代码仓库
          </a>
          反馈意见，帮助我们改进服务。
        </span>
      </div>
    </div>
  );
}
