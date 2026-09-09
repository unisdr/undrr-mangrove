import React, { useId, useState } from 'react';
import { TextCta } from '../../Components/TextCta/TextCta';
import { FormAction } from '../../Components/Forms/FormAction/FormAction';
import { FormGroup } from '../../Components/Forms/FormGroup/FormGroup';
import { Checkbox } from '../../Components/Forms/Checkbox/Checkbox';
import { TextInput } from '../../Components/Forms/TextInput/TextInput';
import reportImage from '../../assets/images/author.png';

const words = {
  english: {
    join: 'Help build a more resilient future',
    joinText:
      'Connect with people working to reduce disaster risk. Share your experience, discover opportunities and find your next collaboration.',
    joinAction: 'Get involved',
    more: 'Learn about our work',
    report: 'Put evidence into action',
    reportText:
      'Explore practical insights that help communities understand risk and prepare for what comes next.',
    reportAction: 'Explore the evidence',
    news: 'Good information. Better prepared.',
    newsText:
      'Disaster risk reduction news, research and practical insights, delivered to your inbox.',
    eyebrow: 'PreventionWeb updates',
    email: 'Email address',
    subscribe: 'Subscribe',
    help: 'Weekly updates. Unsubscribe at any time.',
    topics: 'Your interests (optional)',
    choices: ['Early warning', 'Climate resilience', 'Risk governance'],
    success: 'Thanks — this demo has received your request.',
    note: 'Prototype: submissions stay in this page and do not create a subscription.',
  },
  arabic: {
    join: 'ساهم في بناء مستقبل أكثر قدرة على الصمود',
    joinText:
      'تواصل مع العاملين في الحد من مخاطر الكوارث. شارك خبراتك واكتشف فرص التعاون.',
    joinAction: 'شارك معنا',
    more: 'تعرف على عملنا',
    report: 'حوّل الأدلة إلى عمل',
    reportText:
      'استكشف أفكاراً عملية تساعد المجتمعات على فهم المخاطر والاستعداد للمستقبل.',
    reportAction: 'استكشف الأدلة',
    news: 'معلومات أفضل. استعداد أفضل.',
    newsText:
      'أخبار الحد من مخاطر الكوارث والبحوث والأفكار العملية تصل إلى بريدك الإلكتروني.',
    eyebrow: 'تحديثات شبكة الوقاية',
    email: 'البريد الإلكتروني',
    subscribe: 'اشترك',
    help: 'تحديثات أسبوعية. يمكنك إلغاء الاشتراك في أي وقت.',
    topics: 'اهتماماتك (اختياري)',
    choices: [
      'الإنذار المبكر',
      'القدرة على الصمود أمام تغير المناخ',
      'حوكمة المخاطر',
    ],
    success: 'شكراً — تم استلام طلبك في هذا المثال فقط.',
    note: 'نموذج تجريبي: تبقى البيانات في هذه الصفحة ولا يتم إنشاء اشتراك.',
  },
};

function DemoForm({ text, preferences = false }) {
  const [submitted, setSubmitted] = useState(false);
  const id = useId();
  return (
    <form
      aria-label={text.subscribe}
      aria-describedby={id}
      onSubmit={event => {
        event.preventDefault();
        setSubmitted(true);
      }}
      style={{
        padding: 'var(--mg-spacing-200)',
        background: 'rgb(var(--mg-color-neutral-0))',
        color: 'rgb(var(--mg-color-text))',
        borderRadius: 'var(--mg-card-border-radius)',
      }}
    >
      {preferences ? (
        <>
          <TextInput
            type="email"
            label={text.email}
            name="email"
            autoComplete="email"
            required
          />
          <FormGroup legend={text.topics}>
            {text.choices.map(choice => (
              <Checkbox
                key={choice}
                label={choice}
                name="topics"
                value={choice}
              />
            ))}
          </FormGroup>
          <button className="mg-button mg-button-primary" type="submit">
            {text.subscribe}
          </button>
          <p>{text.help}</p>
        </>
      ) : (
        <FormAction
          label={text.email}
          helpText={text.help}
          stackOnMobile
          control={
            <input type="email" name="email" autoComplete="email" required />
          }
          action={
            <button type="submit" className="mg-button mg-button-primary">
              {text.subscribe}
            </button>
          }
        />
      )}
      <p
        id={id}
        style={{ fontSize: 'var(--mg-font-size-300)', marginBlockEnd: 0 }}
      >
        {text.note}
      </p>
      <div role="status">{submitted ? text.success : ''}</div>
    </form>
  );
}

export default {
  title: 'Example/CTA block prototype',
  parameters: { layout: 'padded' },
  args: {
    variant: 'primary',
    centered: false,
    headlineSize: '700',
    padding: 'clamp(1rem, 4vw, 2rem)',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary', 'quaternary'],
    },
    centered: { control: 'boolean' },
    headlineSize: { control: 'text' },
    padding: { control: 'text' },
  },
};

export const GetInvolved = {
  render: (args, { globals }) => {
    const text = words[globals.locale] || words.english;
    return (
      <TextCta
        {...args}
        headline={text.join}
        text={text.joinText}
        buttons={[
          {
            label: text.joinAction,
            url: 'https://www.undrr.org',
            type: 'Secondary',
          },
          {
            label: text.more,
            url: 'https://www.undrr.org',
            type: 'Secondary',
            outline: true,
          },
        ]}
      />
    );
  },
};
export const WithImage = {
  render: (args, { globals }) => {
    const text = words[globals.locale] || words.english;
    return (
      <TextCta
        {...args}
        headline={text.report}
        text={text.reportText}
        image={reportImage}
        imageAlt=""
        buttons={[
          {
            label: text.reportAction,
            url: 'https://www.preventionweb.net',
            type: 'Secondary',
          },
        ]}
      />
    );
  },
};
export const Newsletter = {
  render: (args, { globals }) => {
    const text = words[globals.locale] || words.english;
    return (
      <TextCta
        {...args}
        eyebrow={text.eyebrow}
        headline={text.news}
        text={text.newsText}
      >
        <DemoForm key={globals.locale} text={text} />
      </TextCta>
    );
  },
};
export const NewsletterWithPreferences = {
  render: (args, { globals }) => {
    const text = words[globals.locale] || words.english;
    return (
      <TextCta
        {...args}
        eyebrow={text.eyebrow}
        headline={text.news}
        text={text.newsText}
      >
        <DemoForm key={globals.locale} text={text} preferences />
      </TextCta>
    );
  },
};
