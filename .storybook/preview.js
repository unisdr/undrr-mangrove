import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { initializeRTL } from 'storybook-addon-rtl';
// import { anysort } from 'anysort'
import renderToHTML from './renderToHTML'

// Theme switcher options
// https://github.com/etchteam/storybook-addon-css-variables-theme#readme
import themeDefault from '!!style-loader?injectType=lazyStyleTag!css-loader!sass-loader!../stories/assets/scss/style.scss'
import themePreventionWeb from '!!style-loader?injectType=lazyStyleTag!css-loader!sass-loader!../stories/assets/scss/style-preventionweb.scss'
import themeIrp from '!!style-loader?injectType=lazyStyleTag!css-loader!sass-loader!../stories/assets/scss/style-irp.scss'
import themeMcr from '!!style-loader?injectType=lazyStyleTag!css-loader!sass-loader!../stories/assets/scss/style-mcr.scss'

// import the decorator from the CSS Variables Theme addon
import cssVariablesTheme from '@etchteam/storybook-addon-css-variables-theme'

// include fonts globally
import '../stories/assets/scss/core/_fonts.scss';

// initialise RTL
initializeRTL();

// Configure Storybook
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  designToken: {
    // https://github.com/UX-and-I/storybook-design-token
    defaultTab: 'Colors',
    disable: true
  },
  html: {
    prettier: {
      tabWidth: 2,
      useTabs: false,
      removeComments: true,
    },
  },
  viewport: {
    viewports: INITIAL_VIEWPORTS,
  },
  docs: {
    transformSource: (src, storyContext) => renderToHTML(storyContext.storyFn),
  },
  options: {
    storySort: {
      method: 'alphabetical',
      order: ['Getting started',['Intro','How to use our design system?','Browser support'], 'Design decisions', 'Components', 'Utilities' ],
      includeName: true
    },
  },
  cssVariables: {
    files: {
      'Default UNDRR Theme': themeDefault,
      'PreventionWeb Theme': themePreventionWeb,
      'IRP Theme': themeIrp,
      'MCR2030 Theme': themeMcr,
    },
    defaultTheme: 'Default UNDRR Theme'
  },
}

/* Implementing locale for language switcher */
// Note: Languages added to items array need to be added to the getLangCode() function below.
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
        { value: 'japanese', title: 'Japanese' }
      ],
    },
  },
};


/**
 * Function to get current language code.
 * @param {*} Story renders Stories in iFrame.
 * @param {*} context Current context for Addons.
 * @returns Current Language Code.
 */
const getLangCode=(Story,context)=>{
  let activeLang = context.globals.locale;

  // trigger onload event
  // UI has some animation element which trigger on load.
  let delay = 10;
  setTimeout(function() {
    const evt = new Event('load');
    window.dispatchEvent(evt);
  }, delay);

  // Set window object for iframe.
  window.UNDRR.langCode = (window.UNDRR) ? activeLang : window.UNDRR= { langCode : activeLang };

  // Language Array to map language alpha code.
  const langArr = {
    'english' : 'en',
    'arabic': 'ar',
    'burmese': 'my',
    'japanese': 'ja'
  };

  // Check if language exists.
  if (typeof langArr[activeLang] == 'undefined') {
    activeLang = 'english';
  }

  // Set HTML lang attribute for iframe.
  const htmlElem = document.querySelector('html');
  htmlElem.setAttribute('lang', langArr[activeLang]);

  return (
    <Story {...context} />
  )
}

const sbFrameReset = (Story, context) => {
  // Get Storybook Iframe's body element.
  const iframeBody = document.querySelector('body');
  // Get Storybook sidebar items in an array.
  const sidebarItem = parent.document.querySelectorAll('.sidebar-item');
  // Add click event listener on each sidebar item.
  sidebarItem.forEach(function (item, i) {
    item.addEventListener('click', function (e) {
      // Classes to remove.
      const classNames = ['sdgmodal-open', 'color-blue'];
      // Check if above classes exist in `body` element and remove them.
      if (classNames.some(className => iframeBody.classList.contains(className))) {
        iframeBody.classList.remove(...classNames);
      }
    });
  });
  return (
    <Story {...context} />
  )
}

const setDirection = (Story, options) => {
  // Set default direction.
  let direction = 'ltr';
  // LTR-RTL Toggle button.
  const input = parent.document.querySelector('[aria-controls="rtl-status"]');
  // Callback function for LTR-RTL Toggle.
  const checkRTL = (elem) => {
    if (elem.checked) {
      direction = 'rtl';
    }
  }
  // Change direction on LTR-RTL Toggle.
  if (input && input.checked) {
    input.addEventListener('change', checkRTL(input), false);
  }
  // Set window object for iframe.
  if (typeof window.UNDRR === 'undefined') {
    window.UNDRR = {};
  }
  window.UNDRR.dir = direction;

  return (
    <Story {...options} />
  )
}

// Trigger callback in Storybook Addons.
  export const decorators = [getLangCode, sbFrameReset, setDirection, cssVariablesTheme, ];
