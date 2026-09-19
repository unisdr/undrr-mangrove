import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

// Default CDN URL for UNDRR Cookie Banner
const DEFAULT_CDN_BASE = 'https://assets.undrr.org/cookie-banner/v1';

/**
 * Reduces a resource URL to a de-duplication key: origin plus path, with the
 * query string and fragment dropped.
 *
 * The CDN's `cookieconsent-undrr.js` declares `const currentScript` and
 * `const configUrl` at classic-script top level, so loading it a second time
 * throws a redeclaration error. The guard against that is the "already loaded"
 * check in `loadScript`, and it used to compare full URLs — which a
 * `?cacheBuster=YYYYMMDDHHMM` query string defeats the moment the clock rolls
 * over to the next minute. Comparing paths means no query-string variant, ours
 * or a caller's, can slip a second copy past the check. See #1246.
 *
 * @param {string} url - Absolute or relative resource URL
 * @returns {string} - Key identifying the underlying resource
 */
const resourceKey = url => {
  try {
    const parsed = new URL(url, document.baseURI);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    // Unparseable URL: fall back to a textual strip of query and fragment.
    return String(url).split('#')[0].split('?')[0];
  }
};

/**
 * Dynamically loads a CSS file
 * @param {string} href - The URL of the CSS file
 * @param {Function} debugLog - Optional debug logging function
 * @returns {Promise} - Promise that resolves when the CSS is loaded
 */
const loadCSS = (href, debugLog) => {
  return new Promise((resolve, reject) => {
    // Check if CSS is already loaded, ignoring query strings (see resourceKey)
    const key = resourceKey(href);
    const existingLink = Array.from(
      document.querySelectorAll('link[rel="stylesheet"][href]')
    ).find(link => resourceKey(link.href) === key);
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
    // Check if script is already loaded, ignoring query strings (see resourceKey)
    const key = resourceKey(src);
    const existingScript = Array.from(
      document.querySelectorAll('script[src]')
    ).find(script => resourceKey(script.src) === key);
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
  // `config` is usually built inline in the caller's render, so a fresh object
  // identity arrives on every render. Depending on that identity directly made
  // every re-render tear the banner down and load it again. Compare by value
  // instead, and read the live object through a ref so the effect does not need
  // it as a dependency. `JSON.stringify` drops functions, so two configs that
  // differ only in callback identity compare equal — which is the point, since
  // inline callbacks are exactly the churn this removes. A config that cannot
  // be serialised (a circular reference) falls back to identity comparison, the
  // previous behaviour. See #1245.
  const configRef = useRef(customConfig);
  configRef.current = customConfig;

  const configKey = useMemo(() => {
    if (!customConfig) return '';
    try {
      return JSON.stringify(customConfig);
    } catch {
      return customConfig;
    }
  }, [customConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const activeConfig = configRef.current;

    // Generate URLs with the provided or default CDN base URL.
    // No cache buster: the CDN path is version-pinned (`/v1/`) and the CDN
    // serves its own caching headers, so a per-minute query string bought
    // nothing but a broken dedupe and a cold cache on every page load (#1246).
    const COOKIECONSENT_CSS_URL = `${cdnBaseUrl}/cookieconsent.css`;
    const COOKIECONSENT_JS_URL = `${cdnBaseUrl}/cookieconsent.umd.js`;
    const COOKIECONSENT_CONFIG_URL = `${cdnBaseUrl}/cookieconsent-undrr.js`;

    // Local debug helpers gated by debug prop
    // eslint-disable-next-line no-console -- opt-in debug channel, silent unless the caller passes `debug`
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
        // The path above guards `run` before calling it; this one used not to,
        // so whenever the library itself had failed to load — the most likely
        // reason for landing in this catch — the handler threw a TypeError out
        // of an un-awaited promise instead of reporting anything.
        if (
          window.CookieConsent &&
          typeof window.CookieConsent.run === 'function'
        ) {
          window.CookieConsent.run(minimalConfig);
          log('Cookie Banner initialized with minimal fallback config');
        } else {
          console.error(
            'CookieConsent library not available for minimal fallback config'
          );
        }
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
            activeConfig &&
            typeof activeConfig === 'object' &&
            Object.keys(activeConfig).length > 0
          ) {
            log('Using custom configuration provided via props');
            try {
              window.CookieConsent.run(activeConfig);
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
                log(
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
      // Cleanup CookieConsent banner when component unmounts.
      // vanilla-cookieconsent v3 has no `destroy()` — the export surface is
      // acceptCategory, acceptService, acceptedCategory, acceptedService,
      // eraseCookies, getConfig, getCookie, getUserPreferences, hide,
      // hidePreferences, loadScript, reset, run, setCookieData, setLanguage,
      // show, showPreferences, validConsent, validCookie. `reset(true)` is the
      // teardown: it detaches the listeners it registered, erases the consent
      // cookie and removes its own root node. See #1245.
      if (
        window.CookieConsent &&
        typeof window.CookieConsent.reset === 'function'
      ) {
        try {
          window.CookieConsent.reset(true);
        } catch (cleanupError) {
          console.error('Error during CookieConsent cleanup:', cleanupError);
        }
      }

      // Belt and braces for the case where the library never ran, or where
      // reset() threw before removing it. `#cc-main` is the only element v3
      // creates. This used to be a document-wide `[id^="cc-"]` sweep, which
      // removed any consumer markup whose id happened to start with `cc-`.
      const bannerRoot = document.getElementById('cc-main');
      if (bannerRoot) bannerRoot.remove();
    };
  }, [configKey, debug, forceFallback, cdnBaseUrl]);

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
