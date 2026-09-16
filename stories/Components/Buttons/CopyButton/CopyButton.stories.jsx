import { CopyButton } from './CopyButton';
import {
  DEFAULT_COPY_BUTTON_LABELS,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_ZH,
  LABELS_AR,
  LABELS_RU,
} from './_labels';

const LOCALE_LABELS = {
  spanish: LABELS_ES,
  french: LABELS_FR,
  japanese: LABELS_JA,
  chinese: LABELS_ZH,
  arabic: LABELS_AR,
  russian: LABELS_RU,
};

const withLocaleLabels = (Story, context) => {
  const labels =
    LOCALE_LABELS[context.globals?.locale] || DEFAULT_COPY_BUTTON_LABELS;
  return <Story {...context} args={{ ...context.args, labels }} />;
};

const meta = {
  title: 'Components/Buttons/CopyButton',
  component: CopyButton,
  decorators: [withLocaleLabels],
  tags: ['autodocs'],
  argTypes: {
    textToCopy: { control: 'text' },
    variant: {
      options: ['outline', 'primary', 'secondary'],
      control: { type: 'inline-radio' },
    },
  },
};

export default meta;

export const Default = {
  args: {
    textToCopy: 'https://undrr.org',
    variant: 'outline',
  },
};

export const Primary = {
  args: {
    textToCopy: 'https://undrr.org',
    variant: 'primary',
  },
};

export const InContext = {
  render: args => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '6px',
      }}
    >
      <code style={{ fontFamily: 'var(--mg-font-family-code)' }}>
        npm install @undrr/mangrove
      </code>
      <CopyButton {...args} />
    </div>
  ),
  args: {
    textToCopy: 'npm install @undrr/mangrove',
  },
};

export const VanillaHtmlLiveIntegration = {
  render: () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
          This example renders pure server HTML and initializes it via{' '}
          <code>mgCopyButton()</code> (zero React runtime dependency):
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '6px',
            width: 'fit-content',
          }}
          ref={el => {
            if (el) {
              import('../../../assets/js/copy-button.js').then(
                ({ mgCopyButton }) => {
                  mgCopyButton(el);
                }
              );
            }
          }}
        >
          <code style={{ fontFamily: 'var(--mg-font-family-code)' }}>
            https://preventionweb.net/knowledge-base
          </code>
          <button
            type="button"
            className="mg-button mg-button-primary mg-button-outline mg-button--icon mg-copy-button"
            data-mg-copy-button
            data-text-to-copy="https://preventionweb.net/knowledge-base"
            data-tooltip-label="Copied!"
            data-copied-label="URL copied to clipboard."
            aria-label="Copy knowledge base URL"
          >
            <span
              className="mg-icon mg-icon-copy mg-button__icon"
              aria-hidden="true"
            />
            <span
              className="mg-copy-button__feedback"
              role="status"
              aria-hidden="true"
            >
              Copied!
            </span>
            <span className="mg-u-sr-only" aria-live="polite" />
          </button>
        </div>
      </div>
    );
  },
};
