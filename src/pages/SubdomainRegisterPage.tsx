import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { ApiError, isServiceUnavailable, subdomainApi } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';

type AvailabilityState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ok'; message: string }
  | { kind: 'bad'; message: string }
  | { kind: 'info'; message: string };

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; id: string; name: string }
  | { kind: 'error'; title: string }
  | { kind: 'offline' };

/** 命名规则：小写字母/数字，连字符不得出现在首尾，长度 2-63 */
const NAME_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

const PURPOSE_OPTIONS = ['个人主页', '项目站点', '网络服务', '其他'];

function validateName(raw: string): string | null {
  const name = raw.trim().toLowerCase();
  if (!name) return '请输入所需的子域名名称。';
  if (name.length < 2) return '子域名长度不得少于 2 个字符。';
  if (!NAME_PATTERN.test(name)) {
    return '仅允许小写字母、数字与连字符，且须以字母或数字开头、结尾。';
  }
  return null;
}

/** IPv4 粗校验（严格校验由后端完成） */
function isValidIPv4(raw: string): boolean {
  const parts = raw.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

/** IPv6 粗校验：仅允许十六进制字符与冒号（严格校验由后端完成） */
function isValidIPv6(raw: string): boolean {
  return /^[0-9a-f:]{2,45}$/i.test(raw) && raw.includes(':');
}

export default function SubdomainRegisterPage() {
  usePageTitle('子域名注册');

  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState(PURPOSE_OPTIONS[0]);
  const [ipv4, setIpv4] = useState('');
  const [ipv6, setIpv6] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [agree, setAgree] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>({ kind: 'idle' });
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' });

  const handleCheck = async () => {
    const error = validateName(name);
    setNameError(error);
    if (error) return;

    const candidate = name.trim().toLowerCase();
    setAvailability({ kind: 'checking' });
    try {
      const result = await subdomainApi.availability(candidate);
      if (result.available) {
        setAvailability({ kind: 'ok', message: `“${candidate}.dn42”当前可申请。` });
      } else {
        setAvailability({
          kind: 'bad',
          message: result.reason ?? `“${candidate}.dn42”已被占用或属于保留字。`,
        });
      }
    } catch (err) {
      setAvailability({
        kind: 'info',
        message: isServiceUnavailable(err)
          ? '注册服务尚未上线，暂时无法查询可用性；接口契约已发布，等待后端部署。'
          : err instanceof ApiError
            ? err.message
            : '查询失败，请稍后重试。',
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const error = validateName(name);
    setNameError(error);
    if (error) return;

    if (!contact.trim()) {
      setSubmit({ kind: 'error', title: '请填写联系邮箱，以便接收审核结果。' });
      return;
    }
    if (ipv4.trim() && !isValidIPv4(ipv4.trim())) {
      setSubmit({ kind: 'error', title: 'IPv4 指向地址格式不正确。' });
      return;
    }
    if (ipv6.trim() && !isValidIPv6(ipv6.trim())) {
      setSubmit({ kind: 'error', title: 'IPv6 指向地址格式不正确。' });
      return;
    }
    if (!ipv4.trim() && !ipv6.trim()) {
      setSubmit({ kind: 'error', title: '请至少填写一个指向地址（IPv4 或 IPv6）。' });
      return;
    }
    if (!agree) {
      setSubmit({ kind: 'error', title: '请先阅读并同意《子域名分配管理办法（试行）》。' });
      return;
    }

    setSubmit({ kind: 'submitting' });
    try {
      const receipt = await subdomainApi.register({
        name: name.trim().toLowerCase(),
        purpose,
        ipv4: ipv4.trim() || undefined,
        ipv6: ipv6.trim() || undefined,
        contact: contact.trim(),
        note: note.trim() || undefined,
        agree: true,
      });
      setSubmit({ kind: 'success', id: receipt.id, name: receipt.name });
    } catch (err) {
      if (isServiceUnavailable(err)) {
        setSubmit({ kind: 'offline' });
      } else if (err instanceof ApiError) {
        setSubmit({ kind: 'error', title: err.message });
      } else {
        setSubmit({ kind: 'error', title: '提交失败，请稍后重试。' });
      }
    }
  };

  return (
    <>
      <div className='page-head'>
        <div className='container'>
          <Breadcrumb items={[{ label: '公民服务', to: '/services' }, { label: '子域名注册' }]} />
          <h1>子域名注册</h1>
          <p className='page-head__sub'>免费申请专属 .dn42 子域名，并将其解析至您在 DN42 网络中的资源。</p>
        </div>
      </div>

      <div className='container page-body'>
        <section className='about-section' aria-labelledby='subdomain-guide'>
          <h2 className='section-title' id='subdomain-guide'>
            办理流程
          </h2>
          <ol className='steps'>
            <li>
              <strong>提交申请</strong>
              在线填写申请表单，确认命名与指向信息无误后提交。
            </li>
            <li>
              <strong>人工审核</strong>
              网络资源管理局将核查命名规范与资源归属，审核结果发送至联系邮箱。
            </li>
            <li>
              <strong>解析生效</strong>
              审核通过后，子域名将登记至政府域名并完成解析，通常在一个工作日内生效。
            </li>
          </ol>
        </section>

        <section className='about-section' aria-labelledby='subdomain-form'>
          <h2 className='section-title' id='subdomain-form'>
            在线申请
          </h2>

          <form className='form-panel' onSubmit={handleSubmit} noValidate>
            <div className='form-grid'>
              <div className={`form-field form-field--full${nameError ? ' has-error' : ''}`}>
                <label htmlFor='sub-name'>
                  所需子域名
                  <span className='req' aria-hidden='true'>
                    *
                  </span>
                </label>
                <div className='input-group'>
                  <input
                    id='sub-name'
                    type='text'
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder='例如：home'
                    autoComplete='off'
                    aria-describedby='sub-name-hint'
                  />
                  <span className='suffix' aria-hidden='true'>
                    .dn42
                  </span>
                  <button type='button' className='btn btn--outline' onClick={handleCheck} disabled={availability.kind === 'checking'}>
                    {availability.kind === 'checking' ? '查询中…' : '查询可用性'}
                  </button>
                </div>
                {nameError ? (
                  <p className='field-error' role='alert'>
                    {nameError}
                  </p>
                ) : (
                  <p className='form-hint' id='sub-name-hint'>
                    仅限小写字母、数字与连字符；www、gov、mail 等属于保留字。
                  </p>
                )}
                {availability.kind !== 'idle' && (
                  <p className={`avail-status avail-status--${availability.kind === 'ok' ? 'ok' : availability.kind === 'bad' ? 'bad' : 'info'}`} role='status'>
                    {availability.kind === 'checking' ? '正在连接注册服务查询……' : availability.message}
                  </p>
                )}
              </div>

              <div className='form-field'>
                <label htmlFor='sub-purpose'>域名用途</label>
                <select id='sub-purpose' value={purpose} onChange={(event) => setPurpose(event.target.value)}>
                  {PURPOSE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className='form-field'>
                <label htmlFor='sub-contact'>
                  联系邮箱
                  <span className='req' aria-hidden='true'>
                    *
                  </span>
                </label>
                <input
                  id='sub-contact'
                  type='email'
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder='用于接收审核结果'
                  autoComplete='email'
                />
              </div>

              <div className='form-field'>
                <label htmlFor='sub-ipv4'>IPv4 指向地址</label>
                <input
                  id='sub-ipv4'
                  type='text'
                  value={ipv4}
                  onChange={(event) => setIpv4(event.target.value)}
                  placeholder='例如：172.20.0.1'
                  autoComplete='off'
                  inputMode='numeric'
                />
                <span className='form-hint'>IPv4 与 IPv6 至少填写一项</span>
              </div>

              <div className='form-field'>
                <label htmlFor='sub-ipv6'>IPv6 指向地址</label>
                <input
                  id='sub-ipv6'
                  type='text'
                  value={ipv6}
                  onChange={(event) => setIpv6(event.target.value)}
                  placeholder='例如：fd42::1'
                  autoComplete='off'
                />
              </div>

              <div className='form-field form-field--full'>
                <label htmlFor='sub-note'>补充说明</label>
                <textarea
                  id='sub-note'
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder='选填：可补充说明用途、所属网络或其他需要审核人员了解的信息。'
                  rows={4}
                />
              </div>

              <div className='form-field form-field--full'>
                <label className='form-check'>
                  <input type='checkbox' checked={agree} onChange={(event) => setAgree(event.target.checked)} />
                  <span>
                    我已阅读并同意
                    <Link to='/policy'>《子域名分配管理办法（试行）》</Link>
                    ，承诺所填信息真实有效，且不将子域名用于违反社区规则或法律的用途。
                  </span>
                </label>
              </div>

              <div className='form-actions'>
                <button type='submit' className='btn btn--primary' disabled={submit.kind === 'submitting'}>
                  {submit.kind === 'submitting' ? '正在提交…' : '提交申请'}
                </button>
                <span className='form-hint'>提交即视为同意上述管理办法与服务条款。</span>
              </div>
            </div>

            {submit.kind === 'success' && (
              <div className='form-status form-status--ok' role='status'>
                <p>
                  <strong>申请已受理。</strong>受理编号：<code>{submit.id}</code>， 申请子域名：<code>{submit.name}.dn42</code>。
                </p>
                <p>审核结果将在 5 个工作日内发送至您的联系邮箱（虚拟工作时间）。</p>
              </div>
            )}

            {submit.kind === 'error' && (
              <div className='form-status form-status--error' role='alert'>
                <p>{submit.title}</p>
              </div>
            )}

            {submit.kind === 'offline' && (
              <div className='form-status form-status--warn' role='status'>
                <p>
                  <strong>注册服务正在部署中。</strong>
                  您填写的内容本次未能发送——后端注册接口尚未上线。
                </p>
                <p>
                  前端已按接口契约完成对接，待后端部署后本表单即可正常提交。 接口规范详见
                  {/* <a
                    href="https://github.com/TES286/gov.dn42/blob/master/docs/api.md"
                    target="_blank"
                    rel="noreferrer"
                  > */}
                  docs/api.md
                  {/*</a>*/}。
                </p>
              </div>
            )}
          </form>
        </section>

        <section className='about-section' aria-labelledby='subdomain-rules'>
          <h2 className='section-title' id='subdomain-rules'>
            命名规则
          </h2>
          <div className='callout'>
            <p>
              <strong>基本规则：</strong>
              子域名长度为 2-63 个字符，仅允许小写字母、数字与连字符，且须以字母或数字开头、结尾； 先到先得、免费分配；单个公民同一时期可持有的子域名数量上限为
              5 个； www、gov、mail、ns、api 等基础设施相关名称属于保留字，不予分配。
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
