import { Logo } from './Logo';
import { getUndrrLogoAsset } from './undrr-logo-assets';

import logoSquare from '../../assets/images/undrr-logo-square-blue.svg';
import logoSquareWhite from '../../assets/images/undrr-logo-square-white.svg';

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
  render: (args, { globals }) => {
    const asset = getUndrrLogoAsset(globals.locale, 'blue');
    return <Logo src={asset.src} alt={'UNDRR logo'} lang={asset.lang} />;
  },
  name: 'UNDRR logo - blue',

  parameters: {
    backgrounds: {
      default: 'white',
    },

    docs: {
      description: {
        story:
          'Follows the Storybook locale toolbar: switch it to see the translated wordmark for languages with a published blue asset (Arabic, Spanish, French, Russian). Chinese has no blue asset and falls back to English; Japanese has no translated asset at all and always falls back to English.',
      },
    },
  },
};

export const DefaultUndrrLogoWhite = {
  render: (args, { globals }) => {
    const asset = getUndrrLogoAsset(globals.locale, 'white');
    return <Logo src={asset.src} alt={'UNDRR logo'} lang={asset.lang} />;
  },
  name: 'UNDRR logo - white',

  parameters: {
    backgrounds: {
      default: 'dark',
    },

    docs: {
      inlineStories: false,
      iframeHeight: '200px',
      description: {
        story:
          'Follows the Storybook locale toolbar. Spanish is the only language with a published white asset today — every other locale falls back to the English default so the logo stays visible on this dark background rather than swapping in a low-contrast black/blue translated image.',
      },
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

export const AutocroppingUndrrLogo = {
  render: (args, { globals }) => {
    const asset = getUndrrLogoAsset(globals.locale, 'white');
    return (
      <div style={{ background: '#004f91', padding: '8px' }}>
        <Logo
          src={asset.src}
          alt={'UNDRR logo'}
          lang={asset.lang}
          crop={asset.translated ? undefined : 'autocrop'}
        />
      </div>
    );
  },

  name: 'UNDRR logo - autocropping',

  parameters: {
    backgrounds: {
      default: 'dark',
    },

    docs: {
      inlineStories: false,
      description: {
        story:
          'The `crop="autocrop"` variant crops to a fixed box below the desktop breakpoint instead of shrinking the whole image, so the wordmark stays legible at small sizes. This is what the page header ("black bar") uses by default — switch to a tablet/mobile viewport (Storybook viewport toolbar) to see the crop take effect. This story also follows the Locale toolbar, but deliberately drops `autocrop` whenever it resolves a translated asset (Spanish is the only locale that changes anything here): translated PNGs are ~2.3-2.9:1, not the ~6.6:1 `autocrop`\'s box is tuned for, and pairing the two would crop the wordmark incorrectly rather than fit it — exactly what PageHeader\'s own `locale` resolution does.',
      },
    },
  },
};
