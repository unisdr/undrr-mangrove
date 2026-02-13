import { Logo } from './Logo';

import logo from '../../assets/images/undrr-logo-blue.svg';
import logoWhite from '../../assets/images/undrr-logo-white.svg';
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
