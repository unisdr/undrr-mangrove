import React from 'react';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

// Import theme SCSS files as lazy-loaded modules (via lazyStyleTag in main.js)
// These provide .use() and .unuse() methods to toggle styles on/off
import themeUNDRR from '../stories/assets/scss/style.scss';
import themePreventionWeb from '../stories/assets/scss/style-preventionweb.scss';
import themeIRP from '../stories/assets/scss/style-irp.scss';
import themeMCR from '../stories/assets/scss/style-mcr.scss';

// Configure Storybook
export const parameters = {
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
};

/* Implementing locale for language switcher */
export const globalTypes = {
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
};

// Function to get current language code
const getLangCode = (Story, context) => {
  let activeLang = context.initialGlobals.locale;

  let delay = 10;
  setTimeout(function () {
    const evt = new Event('load');
    window.dispatchEvent(evt);
  }, delay);

  window.UNDRR = window.UNDRR || {};
  window.UNDRR.langCode = activeLang;

  const langArr = {
    english: 'en',
    arabic: 'ar',
    burmese: 'my',
    japanese: 'ja',
  };

  if (typeof langArr[activeLang] === 'undefined') {
    activeLang = 'english';
  }

  const htmlElem = document.querySelector('html');
  htmlElem.setAttribute('lang', langArr[activeLang]);

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

const setDirection = (Story, context) => {
  let direction = 'ltr';
  const input = parent.document.querySelector('[aria-controls="rtl-status"]');

  const checkRTL = elem => {
    if (elem.checked) {
      direction = 'rtl';
    }
  };

  if (input && input.checked) {
    input.addEventListener('change', checkRTL(input), false);
  }

  window.UNDRR = window.UNDRR || {};
  window.UNDRR.dir = direction;

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

// Apply decorators
export const decorators = [
  getLangCode,
  sbFrameReset,
  setDirection,
  themeDecorator,
];

export const tags = ['autodocs'];
