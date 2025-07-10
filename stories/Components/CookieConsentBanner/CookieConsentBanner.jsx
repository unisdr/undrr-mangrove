import React, { useEffect } from 'react';

// Default CDN URL for UNDRR Cookie Banner
const DEFAULT_CDN_BASE = 'https://assets.undrr.org/static/cookie-banner/v1';

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
 * @returns {Promise} - Promise that resolves when the CSS is loaded
 */
const loadCSS = href => {
  return new Promise((resolve, reject) => {
    // Check if CSS is already loaded
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      console.log(`CSS already loaded: ${href}`);
      resolve();
      return;
    }

    console.log(`Loading CSS: ${href}`);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => {
      console.log(`CSS loaded successfully: ${href}`);
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
 * @returns {Promise} - Promise that resolves when the script is loaded
 */
const loadScript = src => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      console.log(`Script already loaded: ${src}`);
      resolve();
      return;
    }

    console.log(`Loading script: ${src}`);
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      console.log(`Script loaded successfully: ${src}`);
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

    // Debug toggle: Suppress logs unless debug prop is true
    const originalLog = console.log;
    const originalWarn = console.warn;
    if (!debug) {
      console.log = () => {};
      console.warn = () => {};
    }

    const loadFallbackConfig = async () => {
      console.warn('Loading local fallback configuration');
      try {
        // Ensure CSS and core library are loaded
        await loadCSS(COOKIECONSENT_CSS_URL);
        await loadScript(COOKIECONSENT_JS_URL);

        const { default: fallbackConfig } = await import(
          './cookieconsent-config.js'
        );
        console.log('Successfully loaded local fallback configuration');
        if (
          window.CookieConsent &&
          typeof window.CookieConsent.run === 'function'
        ) {
          window.CookieConsent.run(fallbackConfig);
          console.log(
            'Cookie Banner initialized with fallback config successfully'
          );
        } else {
          console.error('CookieConsent library not available in fallback path');
        }
        console.log(
          'Cookie Banner initialized with fallback config successfully'
        );
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
        console.log('Cookie Banner initialized with minimal fallback config');
      }
    };

    const initializeCookieBanner = async () => {
      try {
        // Load CSS first
        await loadCSS(COOKIECONSENT_CSS_URL);

        // Load the main cookieconsent library
        await loadScript(COOKIECONSENT_JS_URL);

        // Load the UNDRR configuration
        await loadScript(COOKIECONSENT_CONFIG_URL);

        // Also fetch and examine the script content to understand what it does
        try {
          const response = await fetch(COOKIECONSENT_CONFIG_URL);
          const scriptContent = await response.text();
          console.log('UNDRR script full content:', scriptContent);
          console.log(
            'UNDRR script contains "config":',
            scriptContent.includes('config')
          );
          console.log(
            'UNDRR script contains "window":',
            scriptContent.includes('window')
          );
          console.log(
            'UNDRR script contains global assignments:',
            scriptContent.match(/window\.\w+\s*=/g) || 'none found'
          );
          console.log(
            'UNDRR script function declarations:',
            scriptContent.match(/function\s+\w+/g) || 'none found'
          );
          console.log(
            'UNDRR script window function assignments:',
            scriptContent.match(/window\.\w+\s*=\s*function/g) || 'none found'
          );
        } catch (fetchError) {
          console.warn(
            'Could not fetch script content for analysis:',
            fetchError
          );
        }

        // Check if the UNDRR script has exposed any initialization functions
        console.log('UNDRR script functions available:', {
          undrrInit: typeof window.undrrInit,
          initUndrrCookies: typeof window.initUndrrCookies,
          loadUndrrConfig: typeof window.loadUndrrConfig,
          undrrCookieInit: typeof window.undrrCookieInit,
          // Check for functions containing 'undrr' or 'cookie'
          undrrFunctions: Object.keys(window).filter(
            key =>
              typeof window[key] === 'function' &&
              (key.toLowerCase().includes('undrr') ||
                key.toLowerCase().includes('cookie'))
          ),
        });

        // Wait a bit for scripts to be fully available and for UNDRR config to initialize
        await new Promise(resolve => setTimeout(resolve, 300));

        // Debug: Check what globals the UNDRR script might have set
        const possibleConfigKeys = Object.keys(window).filter(
          key =>
            key.toLowerCase().includes('cookie') ||
            key.toLowerCase().includes('undrr') ||
            key.toLowerCase().includes('config')
        );

        console.log('Window globals after UNDRR script load:', {
          undrr_cookieconsent_config: window.undrr_cookieconsent_config,
          cookieConsentConfig: window.cookieConsentConfig,
          undrrConfig: window.undrrConfig,
          CookieConsentConfig: window.CookieConsentConfig,
          possibleConfigsCount: possibleConfigKeys.length,
          possibleConfigKeys: possibleConfigKeys,
          possibleConfigValues: possibleConfigKeys.reduce((acc, key) => {
            acc[key] = {
              type: typeof window[key],
              value: window[key],
              isObject: typeof window[key] === 'object' && window[key] !== null,
              hasKeys:
                typeof window[key] === 'object' && window[key] !== null
                  ? Object.keys(window[key]).length
                  : 0,
            };
            return acc;
          }, {}),
        });

        // Check if UNDRR config is available, if not wait a bit more
        if (typeof window.undrr_cookieconsent_config === 'undefined') {
          console.log('UNDRR config not ready, waiting additional time...');
          await new Promise(resolve => setTimeout(resolve, 500));

          // Debug: Check again after additional wait
          const laterPossibleConfigKeys = Object.keys(window).filter(
            key =>
              key.toLowerCase().includes('cookie') ||
              key.toLowerCase().includes('undrr') ||
              key.toLowerCase().includes('config')
          );

          console.log('Window globals after additional wait:', {
            undrr_cookieconsent_config: window.undrr_cookieconsent_config,
            possibleConfigsCount: laterPossibleConfigKeys.length,
            possibleConfigKeys: laterPossibleConfigKeys,
            possibleConfigValues: laterPossibleConfigKeys.reduce((acc, key) => {
              acc[key] = {
                type: typeof window[key],
                value: window[key],
                isObject:
                  typeof window[key] === 'object' && window[key] !== null,
                hasKeys:
                  typeof window[key] === 'object' && window[key] !== null
                    ? Object.keys(window[key]).length
                    : 0,
              };
              return acc;
            }, {}),
          });
        }

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
            console.log('Using custom configuration provided via props');
            try {
              window.CookieConsent.run(customConfig);
              console.log(
                'Cookie Banner initialized with custom config successfully'
              );
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
              console.log("Using UNDRR script's own initialization function");
              try {
                await window.initializeCookieBanner();
                console.log(
                  'UNDRR Cookie Banner initialized via UNDRR script successfully'
                );
              } catch (undrrError) {
                console.error(
                  'UNDRR initializeCookieBanner failed:',
                  undrrError
                );
                // Fallback to local config
                await loadFallbackConfig();
              }
            } else {
              console.log(
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
      console.warn('Force fallback mode enabled, skipping CDN initialization');
      loadFallbackConfig();
    } else {
      initializeCookieBanner();
    }

    return () => {
      // Restore original console methods on cleanup
      console.log = originalLog;
      console.warn = originalWarn;

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

  return null; // This component does not render anything itself
};

export default CookieConsentBanner;
