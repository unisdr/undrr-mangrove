import { CtaExampleForm, ctaExampleWords } from './_examples';
import { TextCta } from './TextCta';
import { INLINE_CTA_ARGS } from './_fixtures';

export default {
  title: 'Components/CTA',
  component: TextCta,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {
    headline: 'Turn knowledge into action',
    text: '<p>Discover practical resources and connect with people working to reduce disaster risk.</p>',
    buttons: [{ label: 'Read more', url: '#' }],
  },
};

export const Secondary = {
  args: {
    headline: 'Join the global platform',
    text: '<p>Register now for the Global Platform for Disaster Risk Reduction 2025.</p>',
    buttons: [
      { label: 'Register', url: '#' },
      { label: 'Learn more', url: '#', type: 'Secondary' },
    ],
    variant: 'secondary',
  },
};

export const Tertiary = {
  args: {
    headline: 'Learn more about the system',
    buttons: [{ label: 'View Documentation', url: '#' }],
    variant: 'tertiary',
  },
};

export const Quaternary = {
  args: {
    headline: 'Take urgent action on climate',
    text: '<p>Climate change is increasing the frequency and intensity of disasters worldwide.</p>',
    buttons: [{ label: 'Learn more', url: '#' }],
    variant: 'quaternary',
  },
};

export const CustomColor = {
  args: {
    headline: 'Custom branded banner',
    text: '<p>Use <code>backgroundColor</code> for any CSS color value.</p>',
    buttons: [{ label: 'Get started', url: '#' }],
    backgroundColor: '#2c5f2d',
  },
};

export const LeftAligned = {
  args: {
    headline: 'Left-aligned CTA',
    text: '<p>Set <code>centered={false}</code> for left-aligned content.</p>',
    buttons: [{ label: 'Take action', url: '#' }],
    centered: false,
  },
};

export const Inline = {
  args: INLINE_CTA_ARGS,
};

export const WithImage = {
  args: {
    headline:
      'Recovery Help Desk: A service of the IRP, responding to requests for support with building back better in recovery from disasters.',
    buttons: [{ label: 'Learn more about the Recovery Help Desk', url: '#' }],
    image:
      'https://recovery.preventionweb.net/sites/default/files/2021-12/Recovery%20Help%20Desk%20Icon%20Background%20White_1.png',
    imageAlt: 'Recovery Help Desk',
    backgroundColor: '#1671cc',
  },
};

export const HeadlineOnly = {
  args: {
    headline: 'A simple call to action with just a headline and button',
    buttons: [{ label: 'Learn more', url: '#' }],
  },
};

export const ExtraPadding = {
  args: {
    headline: 'Learn more about the system',
    buttons: [{ label: 'View documentation', url: '#' }],
    variant: 'tertiary',
    headlineSize: '800',
    padding: '8rem 0',
  },
};

export const Soft = {
  args: {
    headline: 'Stay connected',
    text: '<p>Discover the latest ideas, research and opportunities to reduce disaster risk.</p>',
    buttons: [{ label: 'Explore updates', url: '#' }],
    tone: 'soft',
    centered: false,
  },
};

export const Newsletter = {
  args: { tone: 'soft', centered: false, padding: 'clamp(1rem, 4vw, 2rem)' },
  render: (args, { globals }) => {
    const text = ctaExampleWords[globals.locale] || ctaExampleWords.english;
    return (
      <TextCta
        {...args}
        eyebrow={text.eyebrow}
        headline={text.news}
        text={text.newsText}
      >
        <CtaExampleForm key={globals.locale} text={text} tone={args.tone} />
      </TextCta>
    );
  },
};
export const NewsletterWithPreferences = {
  args: { tone: 'soft', centered: false, padding: 'clamp(1rem, 4vw, 2rem)' },
  render: (args, { globals }) => {
    const text = ctaExampleWords[globals.locale] || ctaExampleWords.english;
    return (
      <TextCta
        {...args}
        eyebrow={text.eyebrow}
        headline={text.news}
        text={text.newsText}
      >
        <CtaExampleForm
          key={globals.locale}
          text={text}
          preferences
          tone={args.tone}
        />
      </TextCta>
    );
  },
};
