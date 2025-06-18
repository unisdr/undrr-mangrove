import React, { useEffect } from 'react';

// Conditional import for vanilla-cookieconsent to avoid SSR/build issues
let CookieConsent;
if (typeof window !== 'undefined') {
  try {
    CookieConsent = require('vanilla-cookieconsent');
    // Import CSS conditionally as well
    require('vanilla-cookieconsent/dist/cookieconsent.css');
    // Make the imported module available globally for storybook reset and other direct calls if needed
    window.CookieConsent = CookieConsent;
  } catch (error) {
    console.warn('vanilla-cookieconsent could not be loaded:', error);
  }
}

const CookieConsentBanner = ({ config: customConfig = {} }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Dynamically import the config to avoid build issues
    import('./cookieconsent-config.js').then(({ default: defaultConfig }) => {
      if (CookieConsent && typeof CookieConsent.run === 'function') {
        const finalConfig =
          customConfig && Object.keys(customConfig).length > 0
            ? customConfig
            : defaultConfig;
        CookieConsent.run(finalConfig);
      } else {
        console.error(
          'CookieConsent module not loaded correctly or run method not available.'
        );
      }
    }).catch(error => {
      console.error('Failed to load cookie consent config:', error);
    });
  }, [customConfig]);

  return null; // This component does not render anything itself
};

export default CookieConsentBanner;
