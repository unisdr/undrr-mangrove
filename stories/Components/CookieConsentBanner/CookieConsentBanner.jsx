import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// Default CDN URL for UNDRR Cookie Banner
const DEFAULT_CDN_BASE = 'https://assets.undrr.org/cookie-banner/v1';

/**
 * Generates a cache buster string in YYYYMMDDHHMM format
 * @returns {string} - Cache buster timestamp
 */
const generateCacheBuster = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}`;
};

/**
 * Dynamically loads a CSS file
 * @param {string} href - The URL of the CSS file
 * @param {Function} debugLog - Optional debug logging function
 * @returns {Promise} - Promise that resolves when the CSS is loaded
 */
const loadCSS = (href, debugLog) => {
  return new Promise((resolve, reject) => {
    // Check if CSS is already loaded
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      debugLog?.(`CSS already loaded: ${href}`);
      resolve();
      return;
    }

    debugLog?.(`Loading CSS: ${href}`);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => {
      debugLog?.(`CSS loaded successfully: ${href}`);
      resolve();
    };
    link.onerror = error => {
      console.error(`Failed to load CSS: ${href}`, error);
      reject(error);
    };
    document.head.appendChild(link);
  });
};

/**
 * Dynamically loads a JavaScript file
 * @param {string} src - The URL of the JavaScript file
 * @param {Function} debugLog - Optional debug logging function
 * @returns {Promise} - Promise that resolves when the script is loaded
 */
const loadScript = (src, debugLog) => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      debugLog?.(`Script already loaded: ${src}`);
      resolve();
      return;
    }

    debugLog?.(`Loading script: ${src}`);
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      debugLog?.(`Script loaded successfully: ${src}`);
      resolve();
    };
    script.onerror = error => {
      console.error(`Failed to load script: ${src}`, error);
      reject(error);
    };
    document.head.appendChild(script);
  });
};

/**
 * Cookie Consent Banner Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.config - Custom configuration to override the default CDN configuration
 * @param {boolean} props.debug - Enable debug logging for troubleshooting
 * @param {boolean} props.forceFallback - Force the component to use local fallback configuration instead of CDN
 * @param {string} props.cdnBaseUrl - Base URL for the CDN resources (defaults to UNDRR CDN)
 * @returns {null} - This component does not render anything itself
 */
const CookieConsentBanner = ({
  config: customConfig = null,
  debug = false,
  forceFallback = false,
  cdnBaseUrl = DEFAULT_CDN_BASE,
}) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Generate URLs with the provided or default CDN base URL
    const CACHE_BUSTER = generateCacheBuster();
    const COOKIECONSENT_CSS_URL = `${cdnBaseUrl}/cookieconsent.css?cacheBuster=${CACHE_BUSTER}`;
    const COOKIECONSENT_JS_URL = `${cdnBaseUrl}/cookieconsent.umd.js?cacheBuster=${CACHE_BUSTER}`;
    const COOKIECONSENT_CONFIG_URL = `${cdnBaseUrl}/cookieconsent-undrr.js?cacheBuster=${CACHE_BUSTER}`;

    // Local debug helpers gated by debug prop
    const log = debug ? console.log : () => {};
    const warn = debug ? console.warn : () => {};

    const loadFallbackConfig = async () => {
      warn('Loading local fallback configuration');
      try {
        // Ensure CSS and core library are loaded
        await loadCSS(COOKIECONSENT_CSS_URL, log);
        await loadScript(COOKIECONSENT_JS_URL, log);

        const { default: fallbackConfig } =
          await import('./cookieconsent-config.js');
        log('Successfully loaded local fallback configuration');
        if (
          window.CookieConsent &&
          typeof window.CookieConsent.run === 'function'
        ) {
          window.CookieConsent.run(fallbackConfig);
          log('Cookie Banner initialized with fallback config successfully');
        } else {
          console.error('CookieConsent library not available in fallback path');
        }
      } catch (fallbackError) {
        console.error('Failed to load local fallback config:', fallbackError);
        // Ultimate fallback - minimal config
        const minimalConfig = {
          guiOptions: {
            consentModal: {
              layout: 'bar inline',
              position: 'bottom',
            },
          },
          categories: {
            necessary: {
              readOnly: true,
            },
          },
          language: {
            default: 'en',
            translations: {
              en: {
                consentModal: {
                  title: 'This website uses cookies',
                  description:
                    'We use cookies to ensure you get the best experience on our website.',
                  acceptAllBtn: 'Accept all',
                  acceptNecessaryBtn: 'Reject all',
                  showPreferencesBtn: 'Manage preferences',
                },
              },
            },
          },
        };
        window.CookieConsent.run(minimalConfig);
        log('Cookie Banner initialized with minimal fallback config');
      }
    };

    const initializeCookieBanner = async () => {
      try {
        // Load CSS first
        await loadCSS(COOKIECONSENT_CSS_URL, log);

        // Load the main cookieconsent library
        await loadScript(COOKIECONSENT_JS_URL, log);

        // Load the UNDRR configuration
        await loadScript(COOKIECONSENT_CONFIG_URL, log);

        // Wait a bit for scripts to be fully available
        await new Promise(resolve => setTimeout(resolve, 300));

        // Initialize the cookie banner
        if (
          window.CookieConsent &&
          typeof window.CookieConsent.run === 'function'
        ) {
          // Check if we should use custom config or let UNDRR script handle it
          if (
            customConfig &&
            typeof customConfig === 'object' &&
            Object.keys(customConfig).length > 0
          ) {
            log('Using custom configuration provided via props');
            try {
              window.CookieConsent.run(customConfig);
              log('Cookie Banner initialized with custom config successfully');
            } catch (configError) {
              console.error(
                'Failed to initialize with custom config:',
                configError
              );
              throw configError;
            }
          } else {
            // Check if UNDRR script has its own initialization function
            if (typeof window.initializeCookieBanner === 'function') {
              log("Using UNDRR script's own initialization function");
              try {
                await window.initializeCookieBanner();
                log('UNDRR Cookie Banner initialized via UNDRR script successfully');
              } catch (undrrError) {
                console.error(
                  'UNDRR initializeCookieBanner failed:',
                  undrrError
                );
                // Fallback to local config
                await loadFallbackConfig();
              }
            } else {
              log(
                'UNDRR initializeCookieBanner not available, using fallback config'
              );
              await loadFallbackConfig();
            }
          }
        } else {
          console.error(
            'CookieConsent library not available after loading from CDN'
          );
        }
      } catch (error) {
        console.error('Failed to load UNDRR Cookie Banner from CDN:', error);
      }
    };

    if (forceFallback) {
      warn('Force fallback mode enabled, skipping CDN initialization');
      loadFallbackConfig();
    } else {
      initializeCookieBanner();
    }

    return () => {
      // Cleanup CookieConsent banner when component unmounts
      if (window.CookieConsent) {
        try {
          if (typeof window.CookieConsent.destroy === 'function') {
            window.CookieConsent.destroy();
          } else if (typeof window.CookieConsent.reset === 'function') {
            // Reset and hide modal
            window.CookieConsent.reset(true);
          }
        } catch (cleanupError) {
          console.error('Error during CookieConsent cleanup:', cleanupError);
        }
      }

      // Remove any banner elements left in DOM (id starts with cc-)
      document.querySelectorAll('[id^="cc-"]').forEach(el => el.remove());
    };
  }, [customConfig, debug, forceFallback, cdnBaseUrl]);

  // Returning an empty Fragment instead of `null` so the Storybook docgen pass
  // (which is configured to use `react-docgen`, see .storybook/main.js) can
  // classify this as a React component and extract its prop contract.
  // `react-docgen` uses JSX presence to identify components; a pure side-effect
  // component that only returns `null` would otherwise have its `propTypes`
  // dropped from the AI manifest. Empty Fragments render nothing in the DOM —
  // behaviourally identical to `return null` for consumers. See #1006.
  return <></>;
};

CookieConsentBanner.propTypes = {
  /** Custom CookieConsent configuration object to override the default CDN configuration */
  config: PropTypes.object,
  /** Enable debug logging for troubleshooting */
  debug: PropTypes.bool,
  /** Force the component to use local fallback configuration instead of CDN */
  forceFallback: PropTypes.bool,
  /** Base URL for the CDN resources (defaults to UNDRR CDN) */
  cdnBaseUrl: PropTypes.string,
};

export default CookieConsentBanner;
