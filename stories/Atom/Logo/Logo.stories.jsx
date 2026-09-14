import { Logo } from './Logo';

import logo from '../../assets/images/undrr-logo-blue.svg';
import logoWhite from '../../assets/images/undrr-logo-white.svg';
import logoSquare from '../../assets/images/undrr-logo-square-blue.svg';
import logoSquareWhite from '../../assets/images/undrr-logo-square-white.svg';

const ASSET_BASE = 'https://assets.undrr.org/logos/undrr/';

export default {
  title: 'Components/Logos',
  component: Logo,

  parameters: {
    backgrounds: {
      default: 'white',

      values: [
        {
          name: 'white',
          value: '#fff',
        },
        {
          name: 'dark',
          value: '#004f91',
        },
      ],
    },
  },
};

export const DefaultUndrrLogoBlue = {
  render: () => <Logo src={logo} alt={'UNDRR logo'} />,
  name: 'UNDRR logo - blue',

  parameters: {
    backgrounds: {
      default: 'white',
    },
  },
};

export const DefaultUndrrLogoWhite = {
  render: () => <Logo src={logoWhite} alt={'UNDRR logo'} />,
  name: 'UNDRR logo - white',

  parameters: {
    backgrounds: {
      default: 'dark',
    },

    docs: {
      inlineStories: false,
      iframeHeight: '200px',
    },
  },
};

export const DefaultUndrrLogoSquareBlue = {
  render: () => (
    <div
      style={{
        maxWidth: '200px',
      }}
    >
      <Logo src={logoSquare} alt={'UNDRR logo'} />
    </div>
  ),

  name: 'UNDRR logo square - blue',

  parameters: {
    backgrounds: {
      default: 'white',
    },

    docs: {
      inlineStories: false,
    },
  },
};

export const DefaultUndrrLogoSquareWhite = {
  render: () => (
    <div
      style={{
        maxWidth: '200px',
      }}
    >
      <Logo src={logoSquareWhite} alt={'UNDRR logo'} />
    </div>
  ),

  name: 'UNDRR logo square - white',

  parameters: {
    backgrounds: {
      default: 'dark',
    },

    docs: {
      inlineStories: false,
    },
  },
};

const TRANSLATED_LOGOS = [
  { lang: 'ar', label: 'Arabic', colors: ['black', 'blue'] },
  { lang: 'es', label: 'Spanish', colors: ['black', 'blue', 'white'] },
  { lang: 'fr', label: 'French', colors: ['black', 'blue'] },
  { lang: 'ru', label: 'Russian', colors: ['black', 'blue'] },
  { lang: 'zh', label: 'Chinese', colors: ['black'] },
];

export const TranslatedUndrrLogos = {
  render: () => (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px' }}>Language</th>
          <th style={{ textAlign: 'left', padding: '8px' }}>Logo</th>
        </tr>
      </thead>
      <tbody>
        {TRANSLATED_LOGOS.map(({ lang, label, colors }) =>
          colors.map(color => (
            <tr key={`${lang}-${color}`}>
              <td style={{ padding: '8px' }}>
                {label} — {color}
              </td>
              <td
                style={{
                  padding: '8px',
                  background: color === 'white' ? '#004f91' : '#fff',
                }}
              >
                <Logo
                  src={`${ASSET_BASE}undrr-logo-${lang}-${color}.png`}
                  alt={`UNDRR logo (${label})`}
                  lang={lang}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  ),

  name: 'UNDRR logo - translated',

  parameters: {
    docs: {
      inlineStories: false,
    },
  },
};

export const AutocroppingUndrrLogo = {
  render: () => (
    <div style={{ background: '#004f91', padding: '8px' }}>
      <Logo src={logoWhite} alt={'UNDRR logo'} autocrop />
    </div>
  ),

  name: 'UNDRR logo - autocropping',

  parameters: {
    backgrounds: {
      default: 'dark',
    },

    docs: {
      inlineStories: false,
      description: {
        story:
          'The `autocrop` variant crops to a fixed box below the desktop breakpoint instead of shrinking the whole image, so the wordmark stays legible at small sizes. This is what the page header ("black bar") uses — switch to a tablet/mobile viewport (Storybook viewport toolbar) to see the crop take effect.',
      },
    },
  },
};
