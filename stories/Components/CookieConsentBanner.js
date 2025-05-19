import React, { useEffect } from 'react';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import * as CookieConsent from 'vanilla-cookieconsent';

const defaultConfig = {
  guiOptions: {
    consentModal: {
      layout: "bar inline",
      position: "bottom",
      equalWeightButtons: true,
      flipButtons: false
    },
    preferencesModal: {
      layout: "box",
      position: "left",
      equalWeightButtons: true,
      flipButtons: false
    }
  },
  categories: {
    necessary: {
      readOnly: true
    },
    functionality: {},
    analytics: {}
  },
  language: {
    default: "en",
    autoDetect: "browser",
    translations: {
      en: {
        consentModal: {
          title: " UNDRR uses cookies to ensure you get the best experience on our website. ",
          description: "",
          closeIconLabel: "",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Reject all",
          showPreferencesBtn: "Manage preferences",
          footer: '<a href="https://www.undrr.org/undrr-privacy-policy">Privacy Policy</a>\n<a href="https://www.undrr.org/terms-and-conditions-use-undrrorg">Terms and conditions</a>'
        },
        preferencesModal: {
          title: "Consent Preferences Center",
          closeIconLabel: "Close modal",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Reject all",
          savePreferencesBtn: "Save preferences",
          serviceCounterLabel: "Service|Services",
          sections: [
            {
              title: "Strictly Necessary Cookies <span class=\"pm__badge\">Always Enabled</span>",
              description: "Aside from the personal information that you disclose for a specific purpose, UNDRR also uses cookies to collect anonymous information about your browsing behavior. Cookies are small data files placed onto your computer or other mobile devices when you access a website. Encrypted information gathered from cookies is used to understand the audience and performance of our websites and improve user experience. This information is anonymous and based on behavior rather than on personally identifiable features.\n\nIf you do not wish to have cookies installed on your computer or mobile device, you can set your browser to notify you before you receive a cookie, giving you the chance to decide whether to accept it. You can also set your browser to turn off cookies. If you do so, however, some areas of UNDRR websites may not function properly.",
              linkedCategory: "necessary"
            },
            {
              title: "",
              description: "",
              linkedCategory: "functionality"
            },
            {
              title: "Analytics Cookies",
              description: "The information will be used internally only for website traffic analysis. If the User provides unique identifying information, such as name, address and other information on forms stored on this Site, such information will be used only for statistical purposes and will not be published for general access. UNDRR, however, assumes no responsibility for the security of this information.",
              linkedCategory: "analytics"
            },
            {
              title: "More information",
              description: "For any query in relation to my policy on cookies and your choices, please <a class=\"cc__link\" href=\"https://www.undrr.org/contact-us\">contact us</a>."
            }
          ]
        }
      }
    }
  }
};

const CookieConsentBanner = ({ config: customConfig = {} }) => {
  useEffect(() => {
    if (CookieConsent && typeof CookieConsent.run === 'function') {
      const finalConfig = (customConfig && Object.keys(customConfig).length > 0) ? customConfig : defaultConfig;
      CookieConsent.run(finalConfig);

                
    } else {
      console.error('CookieConsent module not loaded correctly or run method not available.');
    }
  }, [customConfig]);

  return null; // This component does not render anything itself
};

export default CookieConsentBanner;
