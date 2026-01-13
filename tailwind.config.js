/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './stories/**/*.{js,jsx,ts,tsx,mdx}',
    './.storybook/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],

  // Disable Tailwind's default theme reset
  corePlugins: {
    preflight: false, // CRITICAL: Don't reset existing styles
  },

  theme: {
    // OVERRIDE Tailwind defaults with Mangrove tokens
    extend: {},

    // Custom Mangrove spacing (1rem = 10px!)
    spacing: {
      '0': '0',
      '25': '0.25rem', // 2.5px
      '50': '0.5rem', // 5px
      '75': '0.75rem', // 7.5px
      '100': '1rem', // 10px
      '150': '1.5rem', // 15px
      '175': '1.8rem', // 18px
      '200': '2rem', // 20px
      '250': '2.4rem', // 24px
      '300': '3rem', // 30px
      '350': '3rem', // 30px (duplicate in spec)
      '400': '5rem', // 50px
      '500': '6rem', // 60px
      '600': '8rem', // 80px
      '800': '10rem', // 100px
      '1000': '40rem', // 400px
    },

    // Custom Mangrove colors
    colors: {
      transparent: 'transparent',
      current: 'currentColor',

      white: '#ffffff',
      black: '#1a1a1a',

      blue: {
        50: '#e6edf4',
        100: '#ccdce9',
        200: '#b3cade',
        300: '#99b9d3',
        400: '#80a7c8',
        500: '#6695bd',
        600: '#4d84b2',
        700: '#3372a7',
        800: '#1a619c',
        900: '#004f91',
      },

      orange: {
        50: '#fdf1ea',
        100: '#fbe3d4',
        200: '#f9d6bf',
        300: '#f7c8aa',
        400: '#f5ba95',
        500: '#f3ac7f',
        600: '#f19e6a',
        700: '#ef9155',
        800: '#ed833f',
        900: '#eb752a',
      },

      red: {
        50: '#f9e6e9',
        100: '#f3ced2',
        200: '#ecb5bc',
        300: '#e69da6',
        400: '#e08490',
        500: '#da6b79',
        600: '#d45363',
        700: '#cd3a4d',
        800: '#c72236',
        900: '#c10920',
      },

      neutral: {
        0: '#ffffff',
        25: '#f2f2f2',
        50: '#e6e6e6',
        100: '#cccccc',
        200: '#b3b3b3',
        300: '#999999',
        400: '#808080',
        500: '#666666',
        600: '#4d4d4d',
        700: '#333333',
        800: '#1a1a1a',
        900: '#000000',
      },

      accent: {
        100: '#f4e496',
        200: '#d3cea9',
        300: '#fdf6d9',
        400: '#0a6969',
      },

      sendai: {
        red: {
          400: '#d45363',
          600: '#cd3a4d',
          800: '#c72236',
          900: '#c10920',
        },
        orange: {
          400: '#f19e6a',
          600: '#ef9155',
          800: '#ed833f',
          900: '#eb752a',
        },
        purple: {
          400: '#b669ab',
          600: '#ab549f',
          800: '#a13e93',
          900: '#962987',
        },
        turquoise: {
          400: '#4dc7c6',
          600: '#33bfbe',
          800: '#1ab7b6',
          900: '#00afae',
        },
      },

      interactive: '#004f91',
      'interactive-active': '#3372a7',
    },

    // Font families
    fontFamily: {
      sans: ['Roboto', 'sans-serif'],
      condensed: ['Roboto Condensed', 'sans-serif'],
    },

    // Font sizes (1rem = 10px)
    fontSize: {
      '100': '1rem', // 10px
      '150': '1.125rem', // 11.25px
      '200': '1.25rem', // 12.5px
      '250': '1.4rem', // 14px
      '300': '1.6rem', // 16px (body)
      '400': '1.8rem', // 18px
      '500': '2.3rem', // 23px
      '600': '3.2rem', // 32px
      '800': '3.6rem', // 36px
      '900': '4rem', // 40px
      '1000': '4.8rem', // 48px
      '1100': '6.4rem', // 64px
    },

    // Font weights
    fontWeight: {
      '100': '100',
      '300': '300',
      '400': '400',
      '500': '500',
      '600': '600',
      '700': '700',
      '900': '900',
    },

    // Line heights
    lineHeight: {
      '500': '1.25em',
      '700': '1.5em',
    },

    // Breakpoints (Mangrove custom breakpoints)
    screens: {
      mobile: '480px',
      tablet: '900px',
      desktop: '1164px',
      'desktop-wide': '1440px',
    },

    // Border radius (Mangrove typically uses 0 - square corners)
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      DEFAULT: '0',
      md: '0.5rem',
      lg: '1rem',
      full: '9999px',
    },

    // Box shadows
    boxShadow: {
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      DEFAULT:
        '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },
  },

  plugins: [require('./tailwind-mangrove-plugin.js')],
};
