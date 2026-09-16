import { CtaButton } from './CtaButton';
import { Icon } from '../../../Atom/Icons/Icon';

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
        <div style={{ marginBottom: '2.5rem' }}>
          <p
            style={{
              marginBottom: '1rem',
              fontWeight: 700,
              fontSize: '15px',
            }}
          >
            Light background
          </p>

          {/* Text buttons */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: '12px',
                fontWeight: 600,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Text & CTA
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
          </div>

          {/* Icon + text and responsive */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: '12px',
                fontWeight: 600,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Icon + Text & Responsive
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <button type="button" className="mg-button mg-button-primary">
                <Icon name="download" />
                <span>{caption.detail}</span>
              </button>
              <button type="button" className="mg-button mg-button-secondary">
                <Icon name="search" />
                <span>Search</span>
              </button>
              <button
                type="button"
                className="mg-button mg-button-primary mg-button-outline"
              >
                <span>External</span>
                <Icon name="share" />
              </button>
              <button
                type="button"
                className="mg-button mg-button-primary mg-button--responsive-icon"
              >
                <Icon name="search" />
                <span className="mg-button__label">Responsive</span>
              </button>
            </div>
          </div>

          {/* Icon-only */}
          <div>
            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: '12px',
                fontWeight: 600,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Icon-Only (Square, Round, Small)
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                className="mg-button mg-button-primary mg-button--icon"
                aria-label="Search"
              >
                <Icon name="search" />
              </button>
              <button
                type="button"
                className="mg-button mg-button-secondary mg-button--icon"
                aria-label="Download"
              >
                <Icon name="download" />
              </button>
              <button
                type="button"
                className="mg-button mg-button-primary mg-button-outline mg-button--icon"
                aria-label="Share"
              >
                <Icon name="share" />
              </button>
              <button
                type="button"
                className="mg-button mg-button-primary mg-button--icon mg-button--icon--round"
                aria-label="Search map"
              >
                <Icon name="search" />
              </button>
              <button
                type="button"
                className="mg-button mg-button-secondary mg-button--icon mg-button--icon--round"
                aria-label="Share map"
              >
                <Icon name="share" />
              </button>
              <button
                type="button"
                className="mg-button mg-button-secondary mg-button--icon mg-button--icon--small"
                aria-label="Close"
              >
                <Icon name="times" />
              </button>
              <button
                type="button"
                className="mg-button mg-button-secondary mg-button-outline mg-button--icon mg-button--icon--small"
                aria-label="Download small"
              >
                <Icon name="download" />
              </button>
            </div>
          </div>
        </div>

        {/* Dark background (hero context) */}
        <div
          className="mg-hero mg-hero--contained"
          style={{
            background: 'rgb(var(--mg-color-hero))',
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
                marginBottom: '1rem',
                fontWeight: 700,
                fontSize: '15px',
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
                marginBottom: '1.25rem',
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

            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Icon Buttons on Dark Surface
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <button type="button" className="mg-button mg-button-primary">
                <Icon name="download" />
                <span>{caption.detail}</span>
              </button>
              <button
                type="button"
                className="mg-button mg-button-primary mg-button--icon"
                aria-label="Search"
              >
                <Icon name="search" />
              </button>
              <button
                type="button"
                className="mg-button mg-button-secondary mg-button--icon"
                aria-label="Download"
              >
                <Icon name="download" />
              </button>
              <button
                type="button"
                className="mg-button mg-button-primary mg-button--icon mg-button--icon--round"
                aria-label="Share"
              >
                <Icon name="share" />
              </button>
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
            <Icon name="search" />
          </button>
          <button
            type="button"
            className="mg-button mg-button-secondary mg-button--icon"
            aria-label="Download publication"
          >
            <Icon name="download" />
          </button>
          <button
            type="button"
            className="mg-button mg-button-primary mg-button-outline mg-button--icon"
            aria-label="Share resource"
          >
            <Icon name="share" />
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
            <Icon name="search" />
          </button>
          <button
            type="button"
            className="mg-button mg-button-secondary mg-button--icon mg-button--icon--round"
            aria-label="Share map view"
          >
            <Icon name="share" />
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
            <Icon name="times" />
          </button>
          <button
            type="button"
            className="mg-button mg-button-secondary mg-button-outline mg-button--icon mg-button--icon--small"
            aria-label="Download CSV"
          >
            <Icon name="download" />
          </button>
        </div>
      </div>
    </div>
  ),
};

export const IconWithLabel = {
  name: 'Icon with text label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '14px' }}>
          Leading icon (download, search, filter actions)
        </p>
        <div className="mg-buttons">
          <button type="button" className="mg-button mg-button-primary">
            <Icon name="download" />
            <span>Download report (PDF)</span>
          </button>
          <button type="button" className="mg-button mg-button-secondary">
            <Icon name="search" />
            <span>Search datasets</span>
          </button>
          <button
            type="button"
            className="mg-button mg-button-primary mg-button-outline"
          >
            <Icon name="share" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div>
        <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '14px' }}>
          Trailing icon (external links, directional prompts)
        </p>
        <div className="mg-buttons">
          <a href="#" className="mg-button mg-button-secondary">
            <span>External registry</span>
            <Icon name="share" />
          </a>
        </div>
      </div>
    </div>
  ),
};

export const ResponsiveIconButton = {
  name: 'Responsive icon button',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
        Renders full icon + text label on tablet/desktop, and automatically
        collapses to a compact 36×36px square icon button on mobile. Screen
        readers announce the full label across all screen widths.
      </p>
      <div className="mg-buttons">
        <button
          type="button"
          className="mg-button mg-button-primary mg-button--responsive-icon"
        >
          <Icon name="search" />
          <span className="mg-button__label">Search publications</span>
        </button>
        <button
          type="button"
          className="mg-button mg-button-secondary mg-button--responsive-icon"
        >
          <Icon name="download" />
          <span className="mg-button__label">Download data</span>
        </button>
        <button
          type="button"
          className="mg-button mg-button-primary mg-button-outline mg-button--responsive-icon"
        >
          <Icon name="share" />
          <span className="mg-button__label">Share map</span>
        </button>
      </div>
    </div>
  ),
};
