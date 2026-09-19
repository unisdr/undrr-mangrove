import React, { useEffect, useLayoutEffect, useState } from 'react';
import { expect, waitFor } from 'storybook/test';
import CookieConsentBanner from './CookieConsentBanner';

const CDN_BASE = 'https://assets.undrr.org/cookie-banner/v1';

/**
 * The only option the "Rendering check" story changes on the live CDN
 * configuration. It is a named constant so the play function can assert that
 * the tested configuration is the shipped one plus exactly this one flag —
 * anything else that drifts into the override fails the story rather than
 * quietly widening the gap between what is tested and what is deployed.
 */
const BOT_HIDING_OVERRIDE = { hideFromBots: false };

/**
 * The library's default consent cookie name. `config.json` does not override
 * `cookie`, so this is the name in use.
 */
const CONSENT_COOKIE_NAME = 'cc_cookie';

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
 * Whether an element would actually be seen, on the same terms as jest-dom's
 * `toBeVisible()`.
 *
 * The status line below needs this because the play function's own comment is
 * right: the library builds the bar hidden and reveals it a frame later, and a
 * `visibility: hidden` element still reports a box. A status line that measures
 * only the box can therefore read "Bar rendered" for a bar the play function
 * fails on, which is the one way this canvas can actively mislead a reader.
 *
 * @param {Element} element - The element to test.
 * @returns {boolean} - True when the element and its ancestors are visible.
 */
const isVisible = element => {
  if (!element || !element.isConnected) {
    return false;
  }

  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true,
    });
  }

  // `checkVisibility` is Chromium 105+/Safari 17.4+/Firefox 125+. The canvas is
  // also read by people in whatever browser they have, so fall back to the walk
  // it replaced rather than reporting a visible bar as hidden.
  const view = element.ownerDocument.defaultView;
  for (let node = element; node?.nodeType === 1; node = node.parentElement) {
    const style = view.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse' ||
      style.opacity === '0' ||
      node.hasAttribute('hidden')
    ) {
      return false;
    }
  }

  return true;
};

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
    // Requesting the stylesheet is not the same as applying it. A <link> whose
    // request 404s or is blocked is still enumerated in document.styleSheets,
    // href and all, and the sheet is cross-origin so its cssRules cannot be
    // read either. The only honest proof is a declaration from that sheet
    // landing on the markup: `#cc-main{position:fixed}` is its first rule, and
    // an unstyled div is `static`.
    stylesheetRequested: [...doc.styleSheets].some(
      sheet => sheet.href && sheet.href.includes('cookieconsent.css')
    ),
    stylesheetApplied: main
      ? doc.defaultView.getComputedStyle(main).position === 'fixed'
      : false,
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
      <p>
        <strong>
          With the configuration UNDRR ships, no automated tool will ever see
          this bar
        </strong>{' '}
        — not Playwright, not Puppeteer, not Selenium, not a Storybook play
        function, not a visual regression run. That is <code>hideFromBots</code>{' '}
        working as intended, not a defect in this component. Before concluding
        the banner is broken, open the story in an ordinary browser window.
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
  const [configDelta, setConfigDelta] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Loading the CDN configuration…');

  // Two pieces of state outlive a story change and would otherwise decide
  // whether this story can pass, so both are cleared before the banner's own
  // passive effect runs — that is what the layout effect is for.
  //
  // `window._ccRun` guards `run()` and survives a story change within the one
  // preview document; `reset(true)` clears it, along with the library's loaded
  // configuration and its markup.
  //
  // The stored consent cookie survives a full page reload, and it is the more
  // dangerous of the two: with valid consent the library has nothing to ask
  // and, because `lazyHtmlGeneration` defaults on, it never builds the bar at
  // all. `reset(true)` would erase the cookie too, but `window.CookieConsent`
  // does not exist yet on a fresh load of this story — only when arriving from
  // another story that already loaded it — so the cookie is erased directly.
  useLayoutEffect(() => {
    const name = window.CookieConsent?.getConfig?.('cookie')?.name;
    document.cookie = `${name || CONSENT_COOKIE_NAME}=; path=/; max-age=0`;
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
          //
          // That does mean the configuration under test is not the one
          // production ships, so the difference is measured against the live
          // config.json rather than described: the play function asserts that
          // this list is exactly the one flag.
          const applied = { ...cdnConfig, ...BOT_HIDING_OVERRIDE };
          setConfigDelta(
            Object.keys(applied).filter(key => applied[key] !== cdnConfig[key])
          );
          setConfig(applied);
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

    // The status line is what a reader looking at this canvas will believe, so
    // it covers every runtime condition the play function asserts but one.
    // Measuring a single proxy — the bar's height — used to let it read "Bar
    // rendered" while the assertions it appears to summarise had already
    // failed on an unstyled or still-hidden bar. See
    // unisdr/undrr-mangrove#1244.
    //
    // Two things here are the play function's alone. `BOT_HIDING_OVERRIDE`
    // having exactly one entry is a fact about this file, not about the page.
    // And `CookieConsent.show(true)` not throwing is a call rather than a
    // reading: making it four times a second would rebuild the very DOM every
    // other line below measures. So a status line reading "Bar rendered"
    // against a library that only claims to have built its DOM is still
    // possible — that case, and no other.
    const tick = () => {
      const state = readBannerState(document);
      const failures = [
        [
          Array.isArray(configDelta) &&
            configDelta.filter(key => key !== 'hideFromBots').length === 0,
          'the tested configuration differs from the shipped one by more than hideFromBots',
        ],
        [state.libraryLoaded, 'the library script did not run'],
        [
          state.configScriptLoaded,
          'the UNDRR configuration script did not run',
        ],
        [state.stylesheetRequested, 'cookieconsent.css was not requested'],
        [state.stylesheetApplied, 'cookieconsent.css did not apply'],
        [Boolean(state.main), 'the library built no #cc-main container'],
        [
          Boolean(state.main) && state.main.parentElement === document.body,
          'the container is not a child of the document body',
        ],
        [Boolean(state.modal), 'the library built no consent bar'],
        [
          Boolean(state.modal) &&
            state.modal.getBoundingClientRect().height > 0,
          'the consent bar has no height',
        ],
        // Present is not visible: the library builds the bar hidden and reveals
        // it a frame later, and a hidden element still reports a box.
        [isVisible(state.modal), 'the consent bar is not visible'],
        [Boolean(state.acceptButton), 'the bar has no accept button'],
        [isVisible(state.acceptButton), 'the accept button is not visible'],
      ]
        .filter(([passed]) => !passed)
        .map(([, reason]) => reason);

      setStatus(
        failures.length === 0
          ? 'Bar rendered — the library built, styled and displayed its DOM.'
          : `Not rendered — ${failures.join('; ')}.`
      );
    };

    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [config, configDelta]);

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
        Its <code>play</code> function asserts that the CDN library and
        configuration script ran, that the CDN stylesheet actually applied, that
        the library built its DOM rather than merely defining{' '}
        <code>window.CookieConsent</code>, and that the bar is present and
        visible in the document body where the library appends it.
      </p>
      <p>
        <strong>
          This story does not run the configuration production ships.
        </strong>{' '}
        It takes the live <code>config.json</code> and turns{' '}
        <code>hideFromBots</code> off, because with the shipped default no
        automated browser can ever see this bar and the check could only ever
        fail. The play function pins that gap instead of describing it: it
        asserts that the configuration under test differs from the live CDN one
        by exactly that one flag, so nothing else can drift into the override
        unnoticed. What the check therefore proves is that the library, the
        stylesheet and the UNDRR categories and translations build a visible bar
        — not that a bot-driven visit to a UNDRR site sees one. It never will.
      </p>
      <p
        data-testid="rendering-check-status"
        data-config-delta={
          configDelta ? JSON.stringify(configDelta) : undefined
        }
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

    // The configuration under test is the shipped one plus one override, so
    // pin the override rather than describe it. The static half catches an
    // edit to this file; the runtime half diffs what was passed to the library
    // against the live config.json, and so also catches the CDN changing under
    // us. Anything other than `hideFromBots` differing fails here.
    expect(
      Object.entries(BOT_HIDING_OVERRIDE),
      'the story overrides exactly one option'
    ).toEqual([['hideFromBots', false]]);

    const statusElement = doc.querySelector(
      '[data-testid="rendering-check-status"]'
    );

    await waitFor(
      () => {
        expect(
          statusElement.dataset.configDelta,
          'the live CDN configuration was fetched'
        ).toBeDefined();
      },
      { timeout: 15000 }
    );

    expect(
      JSON.parse(statusElement.dataset.configDelta).filter(
        key => key !== 'hideFromBots'
      ),
      'nothing but hideFromBots differs from the shipped CDN configuration'
    ).toEqual([]);

    // The library builds its DOM behind a network round trip for the config
    // and a deliberate 300ms settle in the component, so every assertion waits.
    await waitFor(
      () => {
        const { stylesheetRequested, libraryLoaded, configScriptLoaded } =
          readBannerState(doc);
        expect(stylesheetRequested, 'cookieconsent.css requested').toBe(true);
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

    // Requesting the stylesheet proves nothing: a 404 leaves the <link> in
    // document.styleSheets with its href, the sheet is cross-origin so its
    // rules cannot be counted, and an unstyled bar is still a visible element
    // with a non-zero box — every other assertion here passes without it.
    // `#cc-main{position:fixed}` is the CDN sheet's first rule, so the
    // computed position is the one signal that separates styled from bare.
    expect(
      readBannerState(doc).stylesheetApplied,
      'cookieconsent.css applied (#cc-main is position: fixed)'
    ).toBe(true);

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
