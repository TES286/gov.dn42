import { Breadcrumb, type Crumb } from '../components/layout/Breadcrumb';
import { useI18n } from '../i18n';
import { usePageTitle } from '../lib/usePageTitle';

interface PlaceholderPageProps {
  title: string;
  crumbs?: Crumb[];
  note?: string;
}

/** 框架阶段占位页：后续按栏目逐一充实 */
export function PlaceholderPage({ title, crumbs, note }: PlaceholderPageProps) {
  const { t } = useI18n();
  usePageTitle(title);

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          {crumbs && <Breadcrumb items={crumbs} />}
          <h1>{title}</h1>
        </div>
      </div>
      <div className='container placeholder'>
        <h2>{t('placeholder.building')}</h2>
        <p>{note ?? t('placeholder.defaultNote')}</p>
      </div>
    </>
  );
}
