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
          'Follows the Storybook locale toolbar. Published blue assets render automatically; Chinese falls back to English because it has no blue asset, and Japanese always falls back to English.',
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
          'Follows the Storybook locale toolbar. White assets render automatically where available; Japanese falls back to English on dark backgrounds.',
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
          'The `crop="autocrop"` variant crops to a fixed box below the desktop breakpoint instead of shrinking the whole image, so the wordmark stays legible at small sizes. It drops `autocrop` whenever a translated asset is selected.',
      },
    },
  },
};
