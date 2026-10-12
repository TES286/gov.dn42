import { Link } from 'react-router-dom';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { faqs } from '../data/faq';
import { usePageTitle } from '../lib/usePageTitle';

export default function FaqPage() {
  usePageTitle('常见问题');

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: '常见问题' }]} />
          <h1>常见问题</h1>
          <p className='page-head__sub'>公民关于政府与网络服务的常见疑问解答。</p>
        </div>
      </div>

      <div className='container page-body'>
        <div className='accordion'>
          {faqs.map((entry) => (
            <details key={entry.question}>
              <summary>{entry.question}</summary>
              <div className='accordion__body'>
                <p>{entry.answer}</p>
              </div>
            </details>
          ))}
        </div>

        <div className='callout callout--spaced'>
          <p>
            <strong>没有找到答案？</strong>
            欢迎前往
            <Link to='/contact'>联系我们</Link>
            页面选择合适的渠道提问，或到
            <a href='https://dn42.dev' target='_blank' rel='noreferrer'>
              DN42 官方 Wiki
            </a>
            查阅网络技术文档。
          </p>
        </div>
      </div>
    </>
  );
}
