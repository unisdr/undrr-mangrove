import React, { useEffect, useLayoutEffect, useState } from 'react';
import { expect, waitFor } from 'storybook/test';
import CookieConsentBanner from './CookieConsentBanner';

const CDN_BASE = 'https://assets.undrr.org/cookie-banner/v1';

/**
 * The consent library appends its markup to the body of the document the story
 * runs in, outside `#storybook-root`, so a canvas-scoped query never sees it.
 * Every check below starts from `canvasElement.ownerDocument` for that reason.
 *
 * @param {HTMLElement} canvasElement - The story canvas.
 * @returns {Document} - The document the library appends into.
 */
const bannerDocument = canvasElement => canvasElement.ownerDocument;

/**
 * Reads the state that distinguishes a working bar from a broken one.
 *
 * `window.CookieConsent` being an object proves only that the library script
 * ran. The library can initialise, report success, and still return from
 * `run()` before it builds any DOM — `show(true)` then throws on an undefined
 * node instead of doing nothing. So the bar itself, not the global, is what
 * gets asserted.
 *
 * @param {Document} doc - The document the library appends into.
 * @returns {Object} - Asset, library, and DOM state.
 */
const readBannerState = doc => {
  const { CookieConsent } = doc.defaultView;
  const main = doc.getElementById('cc-main');
  const modal = doc.querySelector('#cc-main .cm');

  return {
    // The stylesheet is read from document.styleSheets rather than from the
    // <link> element: a <link> that 404s is still in the DOM.
    cssLoaded: [...doc.styleSheets].some(
      sheet => sheet.href && sheet.href.includes('cookieconsent.css')
    ),
    // Both scripts define a global, so the globals prove they executed.
    libraryLoaded: typeof CookieConsent === 'object' && CookieConsent !== null,
    configScriptLoaded:
      typeof doc.defaultView.initializeCookieBanner === 'function',
    main,
    modal,
    acceptButton: doc.querySelector('#cc-main [data-role="all"]'),
  };
};

export default {
  title: 'Components/Notice/CookieConsentBanner',
  component: CookieConsentBanner,
  argTypes: {
    config: {
      control: 'object',
      description:
        'Custom configuration to override the default CDN configuration',
    },
    debug: {
      control: 'boolean',
      description: 'Enable debug logging for troubleshooting',
    },
    forceFallback: {
      control: 'boolean',
      description:
        'Force the component to use local fallback configuration instead of CDN',
    },
    cdnBaseUrl: {
      control: 'text',
      description: 'Base URL for the CDN resources (defaults to UNDRR CDN)',
      defaultValue: 'https://assets.undrr.org/cookie-banner/v1',
    },
  },
};

export const Default = {
  args: {},
  render: args => (
    <div>
      <p>
        <strong>The component renders nothing itself.</strong> It returns an
        empty fragment and its only job is to load the cookie consent library
        and configuration from the UNDRR CDN and hand control to them. The
        consent bar is drawn by that library, not by Mangrove. The console logs{' '}
        <code>Cookie banner initialized successfully</code> once the CDN
        configuration has been applied.
      </p>
      <p>
        <strong>If you see no bar here,</strong> two things can explain it. You
        already have stored consent, in which case the library has nothing to
        ask — clear the <code>cc_cookie</code> cookie, or use the &ldquo;Reset
        banner&rdquo; story. Or you are viewing this through an automated
        browser: the CDN configuration leaves the library&rsquo;s
        <code>hideFromBots</code> default on, and that makes <code>run()</code>
        return before it builds any DOM whenever{' '}
        <code>navigator.webdriver</code> is true. Either way the console still
        logs <code>Cookie banner initialized successfully</code>, so the log is
        not evidence that the bar is there. The &ldquo;Rendering check&rdquo;
        story asserts the bar for real and fails when it is missing.
      </p>
      <CookieConsentBanner {...args} />
    </div>
  ),
};

export const WithResetButton = {
  name: 'Reset banner',
  render: args => {
    const handleResetConsent = () => {
      const cc = window.CookieConsent;
      if (!cc) {
        return;
      }

      // Erase the stored consent so the library has something to ask again,
      // then rebuild and show the bar. `reset(true)` would also erase the
      // cookie, but it wipes the loaded configuration with it, leaving nothing
      // for `show()` to render until `run()` is called a second time.
      cc.eraseCookies(cc.getConfig('cookie').name);
      cc.show(true);
    };

    return (
      <div>
        <p>
          The CookieConsentBanner loads from the UNDRR CDN and will initialize
          below.
        </p>
        <p>
          <small>CDN: {CDN_BASE}/</small>
        </p>
        <p>
          The button erases the stored consent and shows the bar again. The
          consent API in vanilla-cookieconsent v3 is{' '}
          <code>show(createModal)</code>, <code>hide()</code>,{' '}
          <code>reset(eraseCookie)</code> and <code>eraseCookies(name)</code>.
          There is no <code>showConsentModal()</code>. Under an automated
          browser the button does nothing, because the library never built the
          DOM for it to show — see the &ldquo;Rendering check&rdquo; story.
        </p>
        <CookieConsentBanner {...args} />
        <button type="button" onClick={handleResetConsent}>
          Reset consent
        </button>
      </div>
    );
  },
};

/**
 * Mounts the banner against the live CDN configuration with bot hiding turned
 * off, and reports in the canvas whether the library actually built its bar.
 *
 * @returns {JSX.Element} - The rendering check harness.
 */
const RenderingCheckHarness = () => {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Loading the CDN configuration…');

  // Stories share one preview document, and the library guards `run()` with a
  // `window._ccRun` flag that survives a story change. Clearing it here — in a
  // layout effect, which React runs before the banner's own passive effect —
  // means this story always starts from the same place as a fresh page.
  useLayoutEffect(() => {
    window.CookieConsent?.reset?.(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`${CDN_BASE}/config.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`config.json responded ${response.status}`);
        }
        return response.json();
      })
      .then(cdnConfig => {
        if (!cancelled) {
          // The CDN configuration leaves the library's `hideFromBots` default
          // on, which makes `run()` return before building any DOM whenever
          // `navigator.webdriver` is true. Turning it off is what lets this
          // story assert the same bar a person sees.
          setConfig({ ...cdnConfig, hideFromBots: false });
        }
      })
      .catch(fetchError => {
        if (!cancelled) {
          setError(fetchError.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!config) {
      return undefined;
    }

    const tick = () => {
      const modal = document.querySelector('#cc-main .cm');
      setStatus(
        modal && modal.getBoundingClientRect().height > 0
          ? 'Bar rendered — the library built and displayed its DOM.'
          : 'No bar yet — the library has not built its DOM.'
      );
    };

    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [config]);

  return (
    <div>
      <p>
        This story is the one that can tell a working bar from a broken one.
        Everything else about this component looks identical either way: it
        returns an empty fragment, the bar is drawn by the CDN library into the
        document body, and the library logs{' '}
        <code>Cookie banner initialized successfully</code> whether or not it
        built anything.
      </p>
      <p>
        Its <code>play</code> function asserts that the three CDN assets loaded,
        that the library built its DOM rather than merely defining{' '}
        <code>window.CookieConsent</code>, and that the bar is present and
        visible in the document body where the library appends it.
      </p>
      <p
        data-testid="rendering-check-status"
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid currentColor',
          fontWeight: 'bold',
        }}
      >
        {error ? `Could not load the CDN configuration: ${error}` : status}
      </p>
      {config ? <CookieConsentBanner config={config} /> : null}
    </div>
  );
};

export const RenderingCheck = {
  name: 'Rendering check',
  render: () => <RenderingCheckHarness />,
  play: async ({ canvasElement }) => {
    const doc = bannerDocument(canvasElement);

    // The library builds its DOM behind a network round trip for the config
    // and a deliberate 300ms settle in the component, so every assertion waits.
    await waitFor(
      () => {
        const { cssLoaded, libraryLoaded, configScriptLoaded } =
          readBannerState(doc);
        expect(cssLoaded, 'cookieconsent.css loaded').toBe(true);
        expect(libraryLoaded, 'cookieconsent.umd.js loaded').toBe(true);
        expect(configScriptLoaded, 'cookieconsent-undrr.js loaded').toBe(true);
      },
      { timeout: 15000 }
    );

    // `window.CookieConsent` being defined is not the signal. The library can
    // initialise, log success, and return from `run()` before creating a single
    // node. Assert the container and the consent modal inside it.
    await waitFor(
      () => {
        const { main, modal } = readBannerState(doc);
        expect(main, 'the library created its #cc-main container').not.toBe(
          null
        );
        expect(modal, 'the library built the consent bar inside it').not.toBe(
          null
        );
      },
      { timeout: 15000 }
    );

    // The bar lands in the document body, outside the story's own markup, so
    // this is the assertion a canvas-scoped query would have missed.
    expect(readBannerState(doc).main.parentElement).toBe(doc.body);
    expect(canvasElement.contains(readBannerState(doc).main)).toBe(false);

    // Present is not the same as visible. The library builds the bar hidden and
    // reveals it a frame later, and a `visibility: hidden` element still
    // reports a box, so measuring the box is not enough on its own.
    await waitFor(
      () => {
        const { modal, acceptButton } = readBannerState(doc);
        expect(modal).toBeVisible();
        expect(acceptButton).toBeVisible();
        expect(modal.getBoundingClientRect().height).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );

    // `show()` throwing on an undefined node is the symptom that separates
    // "the library built its DOM" from "the library only said it did".
    expect(() => doc.defaultView.CookieConsent.show(true)).not.toThrow();
  },
};

export const FallbackDemo = {
  name: 'Fallback (Local Config)',
  render: args => (
    <div>
      <p>
        This story forces fallback configuration to demonstrate local config
        loading when the CDN is unavailable.
      </p>
      <CookieConsentBanner {...args} forceFallback debug />
    </div>
  ),
};

export const CustomConfigDemo = {
  name: 'Custom Config',
  render: args => {
    const myCustomConfig = {
      guiOptions: {
        consentModal: {
          layout: 'bar inline',
          position: 'bottom',
        },
        preferencesModal: {
          layout: 'box',
          position: 'left',
        },
      },
      categories: {
        necessary: { readOnly: true },
        analytics: {},
        marketing: {},
      },
      language: {
        default: 'en',
        translations: {
          en: {
            consentModal: {
              title: 'Demo – Custom cookie banner',
              description:
                'This banner uses a custom configuration passed via props.',
              acceptAllBtn: 'Accept everything',
              acceptNecessaryBtn: 'Reject non-essential',
              showPreferencesBtn: 'Preferences',
            },
          },
        },
      },
    };

    return (
      <div>
        <p>
          This story passes a <code>config</code> prop to override the default
          or CDN configuration.
        </p>
        <CookieConsentBanner {...args} config={myCustomConfig} debug />
      </div>
    );
  },
};

export const CustomCDNDemo = {
  name: 'Custom CDN URL',
  render: args => {
    const customCDNUrl = 'https://example.com/custom-cookie-banner';

    return (
      <div>
        <p>
          This story demonstrates how to use a custom CDN URL for loading cookie
          banner resources.
        </p>
        <p>
          <strong>Custom CDN URL:</strong> <code>{customCDNUrl}</code>
        </p>
        <p>
          <small>
            Note: This example uses a non-existent CDN URL for demonstration
            purposes. The component will fall back to local configuration when
            the CDN fails.
          </small>
        </p>
        <CookieConsentBanner {...args} cdnBaseUrl={customCDNUrl} debug />
      </div>
    );
  },
};
