import { INITIAL_VIEWPORTS } from "@storybook/addon-viewport";

// Theme switcher options
import themeDefault from "!!style-loader?injectType=lazyStyleTag!css-loader!sass-loader!../stories/assets/scss/style.scss";
import themePreventionWeb from "!!style-loader?injectType=lazyStyleTag!css-loader!sass-loader!../stories/assets/scss/style-preventionweb.scss";
import themeIrp from "!!style-loader?injectType=lazyStyleTag!css-loader!sass-loader!../stories/assets/scss/style-irp.scss";
import themeMcr from "!!style-loader?injectType=lazyStyleTag!css-loader!sass-loader!../stories/assets/scss/style-mcr.scss";

// import the decorator from the CSS Variables Theme addon
import cssVariablesTheme from "@etchteam/storybook-addon-css-variables-theme";

// include fonts globally
import "../stories/assets/scss/_fonts.scss";

// initialise RTL
// initializeRTL();

// Configure Storybook
export const parameters = {
  actions: {
    argTypes: {
      onClick: { action: "clicked" },
      onChange: { action: "changed" },
    },
  }, // explicitly define actions
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  designToken: {
    defaultTab: "Colors",
    disable: true,
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
  options: {
    storySort: {
      method: "alphabetical",
      order: [
        "Getting started",
        ["Intro", "How to use our design system?", "Browser support"],
        "Design decisions",
        "Components",
        "Utilities",
      ],
      includeName: true,
    },
  },
  cssVariables: {
    files: {
      "Default UNDRR Theme": themeDefault,
      "PreventionWeb Theme": themePreventionWeb,
      "IRP Theme": themeIrp,
      "MCR2030 Theme": themeMcr,
    },
    defaultTheme: "Default UNDRR Theme",
  },
};

/* Implementing locale for language switcher */
export const globalTypes = {
  locale: {
    name: "Locale",
    description: "locale",
    defaultValue: "en",
    toolbar: {
      icon: "globe",
      items: [
        { value: "english", title: "English" },
        { value: "arabic", title: "Arabic" },
        { value: "burmese", title: "Burmese" },
        { value: "japanese", title: "Japanese" },
      ],
    },
  },
};

// Function to get current language code
const getLangCode = (Story, context) => {
  let activeLang = context.globals.locale;

  let delay = 10;
  setTimeout(function () {
    const evt = new Event("load");
    window.dispatchEvent(evt);
  }, delay);

  window.UNDRR.langCode = window.UNDRR
    ? activeLang
    : (window.UNDRR = { langCode: activeLang });

  const langArr = {
    english: "en",
    arabic: "ar",
    burmese: "my",
    japanese: "ja",
  };

  if (typeof langArr[activeLang] === "undefined") {
    activeLang = "english";
  }

  const htmlElem = document.querySelector("html");
  htmlElem.setAttribute("lang", langArr[activeLang]);

  return <Story {...context} />;
};

const sbFrameReset = (Story, context) => {
  const iframeBody = document.querySelector("body");
  const sidebarItem = parent.document.querySelectorAll(".sidebar-item");

  sidebarItem.forEach(function (item) {
    item.addEventListener("click", function () {
      const classNames = ["sdgmodal-open", "color-blue"];
      if (
        classNames.some((className) => iframeBody.classList.contains(className))
      ) {
        iframeBody.classList.remove(...classNames);
      }
    });
  });

  return <Story {...context} />;
};

const setDirection = (Story, options) => {
  let direction = "ltr";
  const input = parent.document.querySelector('[aria-controls="rtl-status"]');

  const checkRTL = (elem) => {
    if (elem.checked) {
      direction = "rtl";
    }
  };

  if (input && input.checked) {
    input.addEventListener("change", checkRTL(input), false);
  }

  if (typeof window.UNDRR === "undefined") {
    window.UNDRR = {};
  }
  window.UNDRR.dir = direction;

  return <Story {...options} />;
};

// Apply decorators
export const decorators = [
  getLangCode,
  sbFrameReset,
  setDirection,
  cssVariablesTheme,
];
export const tags = ["autodocs"];
