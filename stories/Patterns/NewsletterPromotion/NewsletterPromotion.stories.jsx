import React, { useEffect, useId, useRef, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { FormAction } from '../../Components/Forms/FormAction/FormAction';
import { TextInput } from '../../Components/Forms/TextInput/TextInput';
import { FormGroup } from '../../Components/Forms/FormGroup/FormGroup';
import { Checkbox } from '../../Components/Forms/Checkbox/Checkbox';

const copy = {
  english: {
    eyebrow: 'PreventionWeb updates',
    title: 'Good information. Better prepared.',
    intro:
      'A weekly selection of disaster risk reduction news, research and practical insights, delivered to your inbox.',
    email: 'Email address',
    subscribe: 'Subscribe',
    explore: 'Explore our newsletters',
    help: 'Weekly updates. Unsubscribe at any time.',
    topics: 'Your interests (optional)',
    options: [
      'Early warning',
      'Climate resilience',
      'Disaster risk governance',
    ],
    preferences:
      'Choose the topics you would like to hear about. Leave these unchecked for general updates.',
    invalid: 'Enter a valid email address.',
    sending: 'Sending…',
    failure:
      'We could not send your request. Please try again. Your choices have been kept.',
    confirmation: 'Check your inbox',
    confirmed:
      'Follow the link in the confirmation email to finish signing up.',
    reset: 'Use another email address',
    demo: 'Interactive example only: no data is sent and no subscription is created.',
    article: 'Turning early warning into early action',
    excerpt:
      'Timely information gives communities more time to prepare. Local knowledge, accessible communication and clear responsibilities help turn a warning into action.',
  },
  arabic: {
    eyebrow: 'تحديثات شبكة الوقاية',
    title: 'معلومات أفضل. استعداد أفضل.',
    intro:
      'مجموعة أسبوعية من أخبار الحد من مخاطر الكوارث والبحوث والأفكار العملية تصل إلى بريدك الإلكتروني.',
    email: 'البريد الإلكتروني',
    subscribe: 'اشترك',
    explore: 'استكشف نشراتنا الإخبارية',
    help: 'تحديثات أسبوعية. يمكنك إلغاء الاشتراك في أي وقت.',
    topics: 'اهتماماتك (اختياري)',
    options: [
      'الإنذار المبكر',
      'القدرة على الصمود أمام تغير المناخ',
      'حوكمة مخاطر الكوارث',
    ],
    preferences:
      'اختر المواضيع التي تهمك، أو اترك الخيارات فارغة للحصول على تحديثات عامة.',
    invalid: 'أدخل عنوان بريد إلكتروني صالحاً.',
    sending: 'جارٍ الإرسال…',
    failure: 'تعذّر إرسال طلبك. يرجى المحاولة مرة أخرى. تم الاحتفاظ بخياراتك.',
    confirmation: 'تحقق من بريدك الوارد',
    confirmed: 'اتبع الرابط في رسالة التأكيد لإكمال الاشتراك.',
    reset: 'استخدم عنوان بريد إلكتروني آخر',
    demo: 'مثال تفاعلي فقط — لا تُرسل أي بيانات ولا يتم إنشاء اشتراك.',
    article: 'تحويل الإنذار المبكر إلى عمل مبكر',
    excerpt:
      'تمنح المعلومات في الوقت المناسب المجتمعات مزيداً من الوقت للاستعداد. وتساعد المعرفة المحلية والتواصل الواضح في تحويل الإنذار إلى عمل.',
  },
};

// Story-only composition: no provider API, persistence or production export.
function Promotion({
  layout = 'compact',
  response = 'success',
  locale = 'english',
}) {
  const text = copy[locale] || copy.english;
  const id = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [invalid, setInvalid] = useState(false);
  const timer = useRef();
  const form = useRef();
  const confirmation = useRef();
  const returningToForm = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (status === 'success') confirmation.current?.focus();
    if (status === 'idle' && returningToForm.current) {
      form.current?.elements.email.focus();
      returningToForm.current = false;
    }
  }, [status]);
  const submit = event => {
    event.preventDefault();
    if (status === 'sending') return;
    const input = form.current.elements.email;
    if (!input.validity.valid) {
      setInvalid(true);
      input.focus();
      return;
    }
    setInvalid(false);
    setStatus('sending');
    timer.current = setTimeout(
      () => setStatus(response === 'error' ? 'error' : 'success'),
      600
    );
  };
  const control = (
    <input
      type="email"
      name="email"
      autoComplete="email"
      required
      value={email}
      onChange={event => setEmail(event.target.value)}
    />
  );
  const action = (
    <button
      className="mg-button mg-button-primary"
      type="submit"
      aria-disabled={status === 'sending'}
    >
      {status === 'sending' ? text.sending : text.subscribe}
    </button>
  );
  return (
    <div
      style={{ maxWidth: '760px', marginInline: 'auto' }}
      lang={locale === 'arabic' ? 'ar' : 'en'}
      dir={locale === 'arabic' ? 'rtl' : 'ltr'}
    >
      <p
        style={{
          fontSize: 'var(--mg-font-size-300)',
          color: 'rgb(var(--mg-color-neutral-700))',
        }}
      >
        {text.demo}
      </p>
      <section
        aria-labelledby={`${id}-heading`}
        className="mg-u-background-color--blue-100"
        style={{
          padding: 'clamp(1rem, 4vw, 2rem)',
          borderRadius: 'var(--mg-card-border-radius)',
          border: '1px solid rgb(var(--mg-color-neutral-200))',
        }}
      >
        <p style={{ marginBlock: '0 0.5rem', fontWeight: 600 }}>
          {text.eyebrow}
        </p>
        <h2 id={`${id}-heading`} style={{ marginBlockStart: 0 }}>
          {text.title}
        </h2>
        <p style={{ maxWidth: '60ch' }}>{text.intro}</p>
        {status === 'success' ? (
          <div>
            <h3 ref={confirmation} tabIndex={-1}>
              {text.confirmation}
            </h3>
            <p>{text.confirmed}</p>
            <button
              type="button"
              className="mg-button mg-button-secondary"
              onClick={() => {
                returningToForm.current = true;
                setStatus('idle');
                setEmail('');
              }}
            >
              {text.reset}
            </button>
          </div>
        ) : (
          <form ref={form} noValidate onSubmit={submit}>
            {layout === 'compact' ? (
              <FormAction
                label={text.email}
                helpText={text.help}
                errorText={invalid ? text.invalid : undefined}
                control={control}
                action={action}
                stackOnMobile
              />
            ) : (
              <>
                <TextInput
                  type="email"
                  name="email"
                  label={text.email}
                  autoComplete="email"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  error={invalid}
                  errorText={invalid ? text.invalid : undefined}
                />
                <p>{text.preferences}</p>
                <FormGroup legend={text.topics}>
                  {text.options.map((label, index) => (
                    <Checkbox
                      key={label}
                      name="topics"
                      value={String(index)}
                      label={label}
                    />
                  ))}
                </FormGroup>
                {action}
                <p>{text.help}</p>
              </>
            )}
            <div role="status" aria-live="polite">
              {status === 'sending' ? text.sending : ''}
            </div>
            {status === 'error' && <p role="alert">{text.failure}</p>}
          </form>
        )}
      </section>
    </div>
  );
}

export default {
  title: 'Example/Newsletter promotion',
  parameters: { layout: 'padded' },
  args: { response: 'success' },
  argTypes: {
    response: {
      options: ['success', 'error'],
      control: 'inline-radio',
      description: 'Simulated service result. No request is sent.',
    },
  },
};
const render =
  layout =>
  (args, { globals }) => (
    <Promotion
      key={`${globals.locale}-${args.response}`}
      {...args}
      layout={layout}
      locale={globals.locale}
    />
  );
export const WithPreferences = { render: render('preferences') };
export const ServiceError = {
  render: render('preferences'),
  args: { response: 'error' },
};
export const AfterArticle = {
  render: (args, { globals }) => {
    const text = copy[globals.locale] || copy.english;
    return (
      <div style={{ maxWidth: '760px', marginInline: 'auto' }}>
        <article style={{ marginBlockEnd: '2rem' }}>
          <h1>{text.article}</h1>
          <p>{text.excerpt}</p>
        </article>
        <Promotion
          key={`${globals.locale}-${args.response}`}
          {...args}
          locale={globals.locale}
        />
      </div>
    );
  },
};
export const CompactSignup = {
  name: 'Validation and confirmation',
  render: render('compact'),
  play: async ({ canvasElement, globals }) => {
    const text = copy[globals.locale] || copy.english;
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: text.subscribe }));
    await expect(canvas.getByText(text.invalid)).toBeVisible();
    await userEvent.type(
      canvas.getByLabelText(text.email),
      'reader@example.org'
    );
    await userEvent.click(canvas.getByRole('button', { name: text.subscribe }));
    await expect(
      await canvas.findByRole('heading', { name: text.confirmation })
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: text.confirmation })
    ).toHaveFocus();
  },
};
