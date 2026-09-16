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

    Variant: {
      options: ['Default', 'CTA'],
      control: { type: 'inline-radio' },
    },

    Outline: {
      control: { type: 'boolean' },
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

export const EditorialCta = {
  args: {
    label: 'Browse all publications',
    Type: 'Primary',
    Variant: 'CTA',
  },
  name: 'Editorial CTA',
};

export const LongLabels = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: '260px' }}>
      <CtaButton
        label="Alle Veröffentlichungen zur Katastrophenvorsorge durchsuchen"
        Variant="CTA"
      />
      <CtaButton
        label="Consulter toutes les publications sur la réduction des risques de catastrophe"
        Variant="CTA"
      />
      <div dir="rtl" lang="ar">
        <CtaButton
          label="استعرض جميع المنشورات المتعلقة بالحد من مخاطر الكوارث"
          Variant="CTA"
        />
      </div>
    </div>
  ),
  name: 'Long labels',
};

export const AllVariants = {
  render: (_args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <>
        {/* Light background */}
        <div style={{ marginBottom: '2rem' }}>
          <p
            style={{
              marginBottom: '0.75rem',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Light background
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <a href="#" className="mg-button mg-button-primary">
              {caption.detail}
            </a>
            <a href="#" className="mg-button mg-button-secondary">
              {caption.detail}
            </a>
            <a
              href="#"
              className="mg-button mg-button-primary mg-button-outline"
            >
              {caption.detail}
            </a>
            <a
              href="#"
              className="mg-button mg-button-secondary mg-button-outline"
            >
              {caption.detail}
            </a>
            <a
              className="mg-button mg-button-primary disabled"
              aria-disabled="true"
            >
              {caption.detail}
            </a>
            <CtaButton label={caption.detail} Variant="CTA" />
          </div>
          <div
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              gap: '10px',
              fontSize: '12px',
              color: '#666',
            }}
          >
            <span style={{ minWidth: '100px' }}>Primary</span>
            <span style={{ minWidth: '100px' }}>Secondary</span>
            <span style={{ minWidth: '100px' }}>Primary outline</span>
            <span style={{ minWidth: '100px' }}>Secondary outline</span>
            <span>Disabled</span>
            <span>Editorial CTA</span>
          </div>
        </div>

        {/* Dark background (hero context) */}
        <div
          className="mg-hero mg-hero--contained"
          style={{
            background: 'var(--mg-hero-bg, #004f91)',
            padding: '2rem',
            margin: 0,
            width: 'auto',
            position: 'relative',
            aspectRatio: 'auto',
          }}
        >
          <div
            className="mg-hero__overlay"
            style={{
              margin: 0,
              maxWidth: 'none',
              padding: 0,
            }}
          >
            <p
              style={{
                marginBottom: '0.75rem',
                fontWeight: 600,
                fontSize: '14px',
                color: '#fff',
              }}
            >
              Dark background (hero context)
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <a href="#" className="mg-button mg-button-primary">
                {caption.detail}
              </a>
              <a href="#" className="mg-button mg-button-secondary">
                {caption.detail}
              </a>
              <CtaButton label={caption.detail} Variant="CTA" />
            </div>
            <div
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                gap: '10px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <span style={{ minWidth: '100px' }}>Primary</span>
              <span>Secondary</span>
              <span>Editorial CTA</span>
            </div>
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

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ShareIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconButtons = {
  name: 'Icon-only buttons',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '14px' }}>
          Standard square icon buttons (36×36px)
        </p>
        <div className="mg-buttons">
          <button
            type="button"
            className="mg-button mg-button-primary mg-button--icon"
            aria-label="Search records"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            className="mg-button mg-button-secondary mg-button--icon"
            aria-label="Download publication"
          >
            <DownloadIcon />
          </button>
          <button
            type="button"
            className="mg-button mg-button-primary mg-button-outline mg-button--icon"
            aria-label="Share resource"
          >
            <ShareIcon />
          </button>
        </div>
      </div>

      <div>
        <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '14px' }}>
          Round floating action buttons (.mg-button--icon--round)
        </p>
        <div className="mg-buttons">
          <button
            type="button"
            className="mg-button mg-button-primary mg-button--icon mg-button--icon--round"
            aria-label="Search map"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            className="mg-button mg-button-secondary mg-button--icon mg-button--icon--round"
            aria-label="Share map view"
          >
            <ShareIcon />
          </button>
        </div>
      </div>

      <div>
        <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '14px' }}>
          Dense toolbar icon buttons (.mg-button--icon--small, 28×28px)
        </p>
        <div className="mg-buttons">
          <button
            type="button"
            className="mg-button mg-button-secondary mg-button--icon mg-button--icon--small"
            aria-label="Close dialog"
          >
            <CloseIcon />
          </button>
          <button
            type="button"
            className="mg-button mg-button-secondary mg-button-outline mg-button--icon mg-button--icon--small"
            aria-label="Download CSV"
          >
            <DownloadIcon />
          </button>
        </div>
      </div>
    </div>
  ),
};
