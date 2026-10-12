import { useI18n } from '../../i18n';

/** 阶段横幅（Phase Banner）
 *  对齐 GOV.UK Design System 的 phase-banner 组件：
 *  阶段标签 + 一句服务说明，置于主内容之上。
 */
export function NoticeBar() {
  const { t } = useI18n();

  return (
    <div className='phase-banner'>
      <div className='container phase-banner__inner'>
        <span className='phase-banner__tag'>{t('phase.tag')}</span>
        <span className='phase-banner__text'>
          {t('phase.text')}{' '}
          <a href='https://github.com/TES286/gov.dn42' target='_blank' rel='noreferrer'>
            {t('phase.feedbackLink')}
          </a>{' '}
          {t('phase.feedbackSuffix')}
        </span>
      </div>
    </div>
  );
}
