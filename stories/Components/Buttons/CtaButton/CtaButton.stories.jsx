import { CtaButton } from './CtaButton';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = { detail: 'Read more' };
      return engText;
    case 'arabic':
      const arabicText = { detail: 'اقرأ أكثر' };
      return arabicText;
    case 'japanese':
      const japaneseText = { detail: '続きを読む' };
      return japaneseText;
    default:
      return { detail: 'Read more' };
  }
};

export default {
  title: 'Components/Buttons/Buttons',
  component: CtaButton,

  argTypes: {
    Type: {
      options: ['Primary', 'Secondary'],
      control: { type: 'inline-radio' },
    },

    State: {
      options: ['Default', 'Disabled'],
      control: { type: 'inline-radio' },
    },
  },
};

export const DefaultButtons = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <CtaButton label={caption.detail} {...args}></CtaButton>;
  },

  name: 'Buttons',
};

export const AllVariants = {
  render: (_args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <>
        {/* Light background */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '14px' }}>
            Light background
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <a href="#" className="mg-button mg-button-primary">
              {caption.detail}
            </a>
            <a href="#" className="mg-button mg-button-secondary">
              {caption.detail}
            </a>
            <a className="mg-button mg-button-primary disabled" aria-disabled="true">
              {caption.detail}
            </a>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '10px', fontSize: '12px', color: '#666' }}>
            <span style={{ minWidth: '100px' }}>Primary</span>
            <span style={{ minWidth: '100px' }}>Secondary</span>
            <span>Disabled</span>
          </div>
        </div>

        {/* Dark background (hero context) */}
        <div className="mg-hero" style={{
          background: 'var(--mg-hero-bg, #004f91)',
          padding: '2rem',
          margin: 0,
          width: 'auto',
          position: 'static',
        }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '14px', color: '#fff' }}>
            Dark background (hero context)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <a href="#" className="mg-button mg-button-primary">
              {caption.detail}
            </a>
            <a href="#" className="mg-button mg-button-secondary">
              {caption.detail}
            </a>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ minWidth: '100px' }}>Primary</span>
            <span>Secondary</span>
          </div>
        </div>
      </>
    );
  },

  name: 'All variants',

  parameters: {
    controls: { disable: true },
  },
};
