import React from 'react';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

// Import theme SCSS files as lazy-loaded modules (via lazyStyleTag in main.js)
// These provide .use() and .unuse() methods to toggle styles on/off
import themeUNDRR from '../stories/assets/scss/style.scss';
import themePreventionWeb from '../stories/assets/scss/style-preventionweb.scss';
import themeIRP from '../stories/assets/scss/style-irp.scss';
import themeMCR from '../stories/assets/scss/style-mcr.scss';

// RTL languages
const rtlLanguages = ['arabic'];

// Language code mapping
const langArr = {
  english: 'en',
  arabic: 'ar',
  burmese: 'my',
  japanese: 'ja',
};

// Decorator to set language and text direction based on locale global
const getLangCode = (Story, context) => {
  const activeLang = context.globals.locale || 'english';

  React.useEffect(() => {
    const langCode = langArr[activeLang] || 'en';
    const direction = rtlLanguages.includes(activeLang) ? 'rtl' : 'ltr';

    // Set lang on html element
    const htmlElem = document.documentElement;
    htmlElem.setAttribute('lang', langCode);

    // Set dir on both html and #storybook-root (where RTL addon sets it)
    htmlElem.setAttribute('dir', direction);
    const storybookRoot = document.getElementById('storybook-root');
    if (storybookRoot) {
      storybookRoot.setAttribute('dir', direction);
    }

    window.UNDRR = window.UNDRR || {};
    window.UNDRR.langCode = activeLang;
    window.UNDRR.dir = direction;

    // Dispatch load event for components that listen for it
    setTimeout(() => {
      window.dispatchEvent(new Event('load'));
    }, 10);
  }, [activeLang]);

  return <Story {...context} />;
};

const sbFrameReset = (Story, context) => {
  const iframeBody = document.querySelector('body');
  const sidebarItem = parent.document.querySelectorAll('.sidebar-item');

  sidebarItem.forEach(function (item) {
    item.addEventListener('click', function () {
      const classNames = ['sdgmodal-open', 'color-blue'];
      if (
        classNames.some(className => iframeBody.classList.contains(className))
      ) {
        iframeBody.classList.remove(...classNames);
      }
    });
  });

  return <Story {...context} />;
};

// Legacy RTL addon support - allows manual RTL toggle to override locale
const setDirection = (Story, context) => {
  React.useEffect(() => {
    const input = parent.document.querySelector('[aria-controls="rtl-status"]');
    if (input?.checked) {
      document.documentElement.setAttribute('dir', 'rtl');
      window.UNDRR = window.UNDRR || {};
      window.UNDRR.dir = 'rtl';
    }
  }, []);

  return <Story {...context} />;
};

const themeStyles = {
  'Global UNDRR Theme': themeUNDRR,
  'PreventionWeb Theme': themePreventionWeb,
  'IRP Theme': themeIRP,
  'MCR2030 Theme': themeMCR,
};

// Track currently active theme
let activeThemeStyle = null;

const themeDecorator = (Story, context) => {
  const selectedTheme = context.globals.theme;

  React.useEffect(() => {
    // Unload previous theme
    if (activeThemeStyle) {
      activeThemeStyle.unuse();
    }

    // Load selected theme
    const newThemeStyle = themeStyles[selectedTheme];
    if (newThemeStyle) {
      newThemeStyle.use();
      activeThemeStyle = newThemeStyle;
    }
  }, [selectedTheme]);

  // Load default theme on initial render
  React.useEffect(() => {
    const defaultTheme = themeStyles['Global UNDRR Theme'];
    if (defaultTheme && !activeThemeStyle) {
      defaultTheme.use();
      activeThemeStyle = defaultTheme;
    }
  }, []);

  return <Story {...context} />;
};

/** @type { import('storybook').Preview } */
const preview = {
  parameters: {
    actions: {
      argTypes: {
        onClick: { action: 'clicked' },
        onChange: { action: 'changed' },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    designToken: {
      defaultTab: 'Colors',
      disable: true,
    },
    html: {
      prettier: {
        tabWidth: 2,
        useTabs: false,
        removeComments: true,
        htmlWhitespaceSensitivity: 'css',
        printWidth: 80,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
      },
    },
    docs: {
      source: {
        format: 'dedent',
      },
    },
    viewport: {
      viewports: INITIAL_VIEWPORTS,
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Introduction',
          'Getting started',
          ['Intro', 'How to use our design system?', 'Browser support'],
          'Design decisions',
          'Components',
          'Utilities',
        ],
        includeName: true,
      },
    },
  },

  globalTypes: {
    locale: {
      name: 'Locale',
      description: 'locale',
      defaultValue: 'en',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'english', title: 'English' },
          { value: 'arabic', title: 'Arabic' },
          { value: 'burmese', title: 'Burmese' },
          { value: 'japanese', title: 'Japanese' },
        ],
      },
    },
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'Global UNDRR Theme',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'Global UNDRR Theme', title: 'Global UNDRR Theme' },
          { value: 'PreventionWeb Theme', title: 'PreventionWeb Theme' },
          { value: 'IRP Theme', title: 'IRP Theme' },
          { value: 'MCR2030 Theme', title: 'MCR2030 Theme' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },

  decorators: [getLangCode, sbFrameReset, setDirection, themeDecorator],

  tags: ['autodocs'],
};

export default preview;
