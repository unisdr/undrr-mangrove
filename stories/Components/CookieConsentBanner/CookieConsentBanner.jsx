import React, { useEffect } from 'react';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import * as CookieConsent from 'vanilla-cookieconsent';
import defaultConfig from './cookieconsent-config';
// Make the imported module available globally for storybook reset and other direct calls if needed
if (typeof window !== 'undefined') {
  window.CookieConsent = CookieConsent;
}


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
