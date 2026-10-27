import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

// Default CDN URL for UNDRR Cookie Banner
const DEFAULT_CDN_BASE = 'https://assets.undrr.org/cookie-banner/v1';

/**
 * The six top-level callbacks vanilla-cookieconsent v3 accepts, taken from
 * `vanilla-cookieconsent/types/index.d.ts` on 3.1.0.
 *
 * The library reads these once, when `run()` is handed its configuration, and
 * holds whatever function it was given for the lifetime of that run. So the
 * component never passes a consumer's callback through directly — it passes a
 * trampoline that looks the current one up at call time. See `configRef`.
 */
const CALLBACK_KEYS = [
  'onFirstConsent',
  'onConsent',
  'onChange',
  'onModalShow',
  'onModalHide',
  'onModalReady',
];

/**
 * Stand-in recorded in the config key for any function-valued property. A
 * config carrying this exact string as a value would key the same as one
 * carrying a function in the same place, which is why it is not a word anyone
 * would write by accident.
 */
const FUNCTION_MARKER = '__mg_fn__';

/**
 * Serialises a config to a string that is stable under two things a caller
 * changes without meaning anything by it: property order, and function
 * identity.
 *
 * `JSON.stringify` is wrong on both counts. It preserves insertion order, so
 * `{a: 1, b: 2}` and `{b: 2, a: 1}` produce different strings and a config
 * assembled by spreading a varying override set tears the banner down for no
 * reason. And it *drops* functions, so a config made only of callbacks — the
 * exact shape this component's own documentation teaches under "Events and
 * Callbacks" — serialises to the constant `"{}"`, and a consumer who ships a
 * new `onConsent` keeps the old one live with no way to tell.
 *
 * Functions are recorded as a marker rather than dropped, so that *whether* a
 * callback is present still registers while its identity does not. Swapping a
 * handler is then free: the key does not change, no reinitialisation happens,
 * and the trampoline picks the new function up on its next call.
 *
 * @param {*} value - Any config value
 * @param {WeakSet} seen - Ancestors on the current path, for cycle detection
 * @returns {string} - Order-independent serialisation
 * @throws {TypeError} - On a circular reference, matching JSON.stringify
 */
const stableSerialise = (value, seen) => {
  if (typeof value === 'function') return JSON.stringify(FUNCTION_MARKER);
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (seen.has(value)) {
    throw new TypeError('Converting circular structure to a config key');
  }
  seen.add(value);
  const serialised = Array.isArray(value)
    ? `[${value.map(item => stableSerialise(item, seen)).join(',')}]`
    : `{${Object.keys(value)
        .sort()
        .map(
          key => `${JSON.stringify(key)}:${stableSerialise(value[key], seen)}`
        )
        .join(',')}}`;
  // Only the current path matters: a value referenced twice side by side is
  // not a cycle.
  seen.delete(value);
  return serialised;
};

/** Collapses `//` runs in a path, so `/v1//file.css` keys as `/v1/file.css`. */
const collapseSlashes = pathname => pathname.replace(/\/{2,}/g, '/');

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
 * Repeated slashes are collapsed as well. A caller passing `cdnBaseUrl` with a
 * trailing slash produces `/v1//cookieconsent.css`, which the server serves as
 * the same file but which would not match a `/v1/cookieconsent.css` already on
 * the page — the dedupe would miss and the redeclaration crash would be back.
 *
 * @param {string} url - Absolute or relative resource URL
 * @returns {string} - Key identifying the underlying resource
 */
const resourceKey = url => {
  try {
    const parsed = new URL(url, document.baseURI);
    return `${parsed.origin}${collapseSlashes(parsed.pathname)}`;
  } catch {
    // Unparseable URL: fall back to a textual strip of query and fragment.
    return collapseSlashes(String(url).split('#')[0].split('?')[0]);
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
  // every re-render tear the banner down and load it again. The effect keys off
  // a value-based serialisation instead (see `stableSerialise`) and reads the
  // live object through this ref, so it does not need `config` as a dependency.
  // A config that cannot be serialised (a circular reference) falls back to
  // identity comparison, the pre-#1245 behaviour.
  const configRef = useRef(customConfig);

  // Synchronising in an effect rather than during render: React 19 documents a
  // render-phase ref write as unsupported. This effect is declared before the
  // one that loads the banner, and effects run in declaration order, so the ref
  // is current before anything reads it.
  useEffect(() => {
    configRef.current = customConfig;
  });

  const configKey = useMemo(() => {
    if (!customConfig) return '';
    try {
      return stableSerialise(customConfig, new WeakSet());
    } catch {
      return customConfig;
    }
  }, [customConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // Loading three CDN assets and waiting 300ms takes longer than a story
    // change, a route change or a re-render with new props. Without this flag
    // the chain from the discarded mount still reaches `run()` after cleanup
    // has torn the banner down — it then re-runs the library over whatever the
    // current mount has built, or builds a bar the current mount will not clean
    // up. It also made this component's own test suite order-dependent: a
    // pending 300ms wait from one test resolved into the next test's freshly
    // created mock. See unisdr/undrr-mangrove#1244.
    let cancelled = false;
    let settleTimer;

    // The library is handed these instead of the consumer's own callbacks, and
    // holds them for the lifetime of the run. Each one looks the current
    // handler up at call time, so replacing `onConsent` takes effect on the
    // next call with no teardown, no reload and no reinitialisation — which is
    // what makes it safe for `configKey` to ignore function identity.
    const liveCallbacks = {};
    CALLBACK_KEYS.forEach(key => {
      liveCallbacks[key] = (...args) => configRef.current?.[key]?.(...args);
    });
    const withLiveCallbacks = source => ({ ...source, ...liveCallbacks });

    // Generate URLs with the provided or default CDN base URL.
    // No cache buster: the CDN path is version-pinned (`/v1/`) and the CDN
    // serves its own caching headers, so a per-minute query string bought
    // nothing but a broken dedupe and a cold cache on every page load (#1246).
    const base = String(cdnBaseUrl).replace(/\/+$/, '');
    const COOKIECONSENT_CSS_URL = `${base}/cookieconsent.css`;
    const COOKIECONSENT_JS_URL = `${base}/cookieconsent.umd.js`;
    const COOKIECONSENT_CONFIG_URL = `${base}/cookieconsent-undrr.js`;

    // Local debug helpers gated by debug prop
    // eslint-disable-next-line no-console -- opt-in debug channel, silent unless the caller passes `debug`
    const log = debug ? console.log : () => {};
    const warn = debug ? console.warn : () => {};

    const loadFallbackConfig = async () => {
      warn('Loading local fallback configuration');
      try {
        // Ensure CSS and core library are loaded
        await loadCSS(COOKIECONSENT_CSS_URL, log);
        if (cancelled) return;
        await loadScript(COOKIECONSENT_JS_URL, log);
        if (cancelled) return;

        const { default: fallbackConfig } =
          await import('./cookieconsent-config.js');
        if (cancelled) return;
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
        if (cancelled) return;
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
                    'Cookies help ensure you get the best experience on this website.',
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
        if (cancelled) return;

        // Load the main cookieconsent library
        await loadScript(COOKIECONSENT_JS_URL, log);
        if (cancelled) return;

        // Load the UNDRR configuration
        await loadScript(COOKIECONSENT_CONFIG_URL, log);
        if (cancelled) return;

        // Wait a bit for scripts to be fully available
        await new Promise(resolve => {
          settleTimer = setTimeout(resolve, 300);
        });
        if (cancelled) return;

        // Initialize the cookie banner
        if (
          window.CookieConsent &&
          typeof window.CookieConsent.run === 'function'
        ) {
          // Read the config now rather than at effect time: by the time three
          // CDN assets have loaded the caller may be several renders further on.
          const activeConfig = configRef.current;

          // Check if we should use custom config or let UNDRR script handle it
          if (
            activeConfig &&
            typeof activeConfig === 'object' &&
            Object.keys(activeConfig).length > 0
          ) {
            log('Using custom configuration provided via props');
            try {
              window.CookieConsent.run(withLiveCallbacks(activeConfig));
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
                if (cancelled) return;
                log(
                  'UNDRR Cookie Banner initialized via UNDRR script successfully'
                );
              } catch (undrrError) {
                if (cancelled) return;
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
      cancelled = true;
      clearTimeout(settleTimer);

      // Cleanup CookieConsent banner when component unmounts.
      // vanilla-cookieconsent v3 has no `destroy()` — the export surface is
      // acceptCategory, acceptService, acceptedCategory, acceptedService,
      // eraseCookies, getConfig, getCookie, getUserPreferences, hide,
      // hidePreferences, loadScript, reset, run, setCookieData, setLanguage,
      // show, showPreferences, validConsent, validCookie. `reset` is the
      // teardown.
      //
      // The argument is `false`, and that matters. In the 3.1.0 bundle the
      // argument gates exactly one thing — erasing the visitor's consent
      // cookie (`e && (l ? De(c) : Pe(c, r, i))`). Detaching the listeners,
      // removing the `#cc-main` root, clearing the modal classes, resetting
      // internal state and clearing `window._ccRun` are all unconditional. So
      // `reset(false)` is the complete teardown and `reset(true)` is that plus
      // a cookie wipe — which means unmounting the banner on a route change
      // used to destroy the visitor's recorded consent and re-prompt them.
      // See #1245.
      if (
        window.CookieConsent &&
        typeof window.CookieConsent.reset === 'function'
      ) {
        try {
          window.CookieConsent.reset(false);
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
