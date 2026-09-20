import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import CookieConsentBanner from '../CookieConsentBanner';

const CDN_BASE = 'https://assets.undrr.org/cookie-banner/v1';

/**
 * jsdom does not fetch or execute external scripts and stylesheets, so
 * `onload` never fires and the component's load promises would hang forever.
 * Append for real — the de-duplication checks read the document — then settle
 * the element the way a browser would.
 *
 * Note what this deliberately does not model: `onload` fires whether or not the
 * script would have executed, and `beforeEach` pre-seeds `window.CookieConsent`
 * regardless. So nothing in this file proves that appending a script produces
 * the library — these tests assert de-duplication, teardown and config
 * handling, all of which are pure DOM and call bookkeeping. The check that the
 * CDN bundle really loads and really builds a bar is the "Rendering check"
 * story's play function, which runs in a real browser against the live CDN
 * (#1242).
 */
const installLoader = ({ fail = false } = {}) =>
  jest.spyOn(document.head, 'appendChild').mockImplementation(node => {
    const appended = Node.prototype.appendChild.call(document.head, node);
    Promise.resolve().then(() => {
      if (fail) {
        appended.onerror?.(new Event('error'));
      } else {
        appended.onload?.();
      }
    });
    return appended;
  });

const resourcesNamed = name =>
  Array.from(document.head.querySelectorAll('script[src], link[href]')).filter(
    el => (el.src || el.href).includes(name)
  );

const minimalConfig = () => ({
  categories: { necessary: { readOnly: true } },
  language: {
    default: 'en',
    translations: { en: { consentModal: { title: 'Test banner' } } },
  },
});

describe('CookieConsentBanner', () => {
  let run;
  let reset;

  beforeEach(() => {
    run = jest.fn();
    reset = jest.fn();
    window.CookieConsent = { run, reset };
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.CookieConsent;
    delete window.initializeCookieBanner;
    document.head.querySelectorAll('script[src], link[href]').forEach(el => {
      el.remove();
    });
    document.body.innerHTML = '';
  });

  // --------------------------------------------------
  // Rendering
  // --------------------------------------------------

  it('renders no DOM of its own and has no accessibility violations', async () => {
    installLoader();
    const { container } = render(<CookieConsentBanner />);
    expect(container).toBeEmptyDOMElement();
    expect(await axe(container)).toHaveNoViolations();
  });

  // --------------------------------------------------
  // Script and stylesheet de-duplication (#1246)
  // --------------------------------------------------

  it('does not append a cache-busting query string to CDN URLs', async () => {
    installLoader();
    render(<CookieConsentBanner />);

    await waitFor(() => expect(run).toHaveBeenCalled(), { timeout: 3000 });

    const urls = Array.from(
      document.head.querySelectorAll('script[src], link[href]')
    ).map(el => el.src || el.href);
    expect(urls.length).toBeGreaterThan(0);
    urls.forEach(url => expect(url).not.toContain('cacheBuster'));
  });

  it('treats a script already on the page as loaded even when its URL carries a query string', async () => {
    // Proves the dedupe only. The seeded script has not executed, so in a real
    // browser `window.CookieConsent` would be undefined here — see the note on
    // `installLoader`.
    // The shape the cache buster used to produce: same file, different query.
    const seeded = document.createElement('script');
    seeded.src = `${CDN_BASE}/cookieconsent-undrr.js?cacheBuster=202601010000`;
    document.head.appendChild(seeded);

    installLoader();
    render(<CookieConsentBanner />);

    await waitFor(() => expect(run).toHaveBeenCalled(), { timeout: 3000 });

    // A second copy of this file throws a redeclaration error on the page.
    expect(resourcesNamed('cookieconsent-undrr.js')).toHaveLength(1);
  });

  it('treats a stylesheet already on the page as loaded even when its URL carries a query string', async () => {
    // As above: a de-duplication assertion, not an end-to-end load assertion.
    const seeded = document.createElement('link');
    seeded.rel = 'stylesheet';
    seeded.href = `${CDN_BASE}/cookieconsent.css?cacheBuster=202601010000`;
    document.head.appendChild(seeded);

    installLoader();
    render(<CookieConsentBanner />);

    await waitFor(() => expect(run).toHaveBeenCalled(), { timeout: 3000 });

    expect(resourcesNamed('cookieconsent.css')).toHaveLength(1);
  });

  it('loads each CDN resource once across a mount, unmount and remount', async () => {
    installLoader();
    const first = render(<CookieConsentBanner />);
    await waitFor(() => expect(run).toHaveBeenCalled(), { timeout: 3000 });
    first.unmount();

    run.mockClear();
    render(<CookieConsentBanner />);
    await waitFor(() => expect(run).toHaveBeenCalled(), { timeout: 3000 });

    expect(resourcesNamed('cookieconsent-undrr.js')).toHaveLength(1);
    expect(resourcesNamed('cookieconsent.umd.js')).toHaveLength(1);
    expect(resourcesNamed('cookieconsent.css')).toHaveLength(1);
  });

  // --------------------------------------------------
  // Unmount cleanup (#1245)
  // --------------------------------------------------

  it('tears down with reset(false) and never calls a destroy() the library does not have', async () => {
    const destroy = jest.fn();
    window.CookieConsent = { run, reset, destroy };

    installLoader();
    const { unmount } = render(<CookieConsentBanner />);
    await waitFor(() => expect(run).toHaveBeenCalled(), { timeout: 3000 });

    unmount();

    expect(reset).toHaveBeenCalledWith(false);
    expect(destroy).not.toHaveBeenCalled();
  });

  it('leaves the visitor’s consent cookie in place on unmount', async () => {
    document.cookie =
      'cc_cookie=%7B%22categories%22%3A%5B%22necessary%22%5D%7D';
    expect(document.cookie).toContain('cc_cookie');

    // Model the library's own `reset`: in the 3.1.0 bundle the argument gates
    // exactly one thing, erasing the consent cookie. Everything else it does is
    // unconditional, so `reset(false)` is a full teardown that keeps consent.
    reset = jest.fn(eraseCookie => {
      if (eraseCookie) {
        document.cookie = 'cc_cookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    });
    window.CookieConsent = { run, reset };

    installLoader();
    const { unmount } = render(<CookieConsentBanner />);
    await waitFor(() => expect(run).toHaveBeenCalled(), { timeout: 3000 });

    unmount();

    expect(document.cookie).toContain('cc_cookie');
    document.cookie = 'cc_cookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('leaves unrelated cc- prefixed markup alone on unmount', async () => {
    document.body.innerHTML =
      '<div id="cc-analytics-widget">consumer markup</div>';

    installLoader();
    const { unmount } = render(<CookieConsentBanner />);
    await waitFor(() => expect(run).toHaveBeenCalled(), { timeout: 3000 });

    unmount();

    expect(document.getElementById('cc-analytics-widget')).not.toBeNull();
  });

  it("removes the library's own #cc-main container on unmount", async () => {
    installLoader();
    const { unmount } = render(<CookieConsentBanner />);
    await waitFor(() => expect(run).toHaveBeenCalled(), { timeout: 3000 });

    // Stand in for the container the library appends to document.body. The
    // reset() stub here does not remove it, which is also the real-world case
    // where the library failed before building its DOM.
    const bannerRoot = document.createElement('div');
    bannerRoot.id = 'cc-main';
    document.body.appendChild(bannerRoot);

    unmount();

    expect(document.getElementById('cc-main')).toBeNull();
  });

  // --------------------------------------------------
  // Config identity (#1245)
  // --------------------------------------------------

  it('does not tear down and reload when a re-render passes an equal config object', async () => {
    installLoader();
    const { rerender } = render(
      <CookieConsentBanner config={minimalConfig()} />
    );
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });

    // A new object with the same contents, as an inline config in render gives.
    rerender(<CookieConsentBanner config={minimalConfig()} />);

    await Promise.resolve();
    expect(reset).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('does tear down and reload when the config value actually changes', async () => {
    installLoader();
    const { rerender } = render(
      <CookieConsentBanner config={minimalConfig()} />
    );
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });

    const changed = minimalConfig();
    changed.categories.analytics = {};
    rerender(<CookieConsentBanner config={changed} />);

    await waitFor(() => expect(run).toHaveBeenCalledTimes(2), {
      timeout: 3000,
    });
    expect(reset).toHaveBeenCalledWith(false);
  });

  it('does not tear down when a config is rebuilt with its keys in a different order', async () => {
    installLoader();
    const { rerender } = render(
      <CookieConsentBanner
        config={{ ...minimalConfig(), autoShow: true, revision: 2 }}
      />
    );
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });

    // Same config, assembled by spreading a varying override set — which is
    // how a caller with conditional overrides produces it.
    rerender(
      <CookieConsentBanner
        config={{ revision: 2, autoShow: true, ...minimalConfig() }}
      />
    );

    await Promise.resolve();
    expect(reset).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('routes a callback through to the handler the latest render passed, without reloading', async () => {
    const first = jest.fn();
    const second = jest.fn();

    installLoader();
    const { rerender } = render(
      <CookieConsentBanner config={{ ...minimalConfig(), onConsent: first }} />
    );
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });

    rerender(
      <CookieConsentBanner config={{ ...minimalConfig(), onConsent: second }} />
    );
    await Promise.resolve();

    // Swapping a handler must not cost a teardown and reload...
    expect(reset).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledTimes(1);

    // ...and the library, which captured its callbacks when it was handed the
    // config, must still reach the current handler.
    const handedToLibrary = run.mock.calls[0][0];
    handedToLibrary.onConsent({ cookie: {} });

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it('reaches a callback that only the second render supplied', async () => {
    const added = jest.fn();

    installLoader();
    const { rerender } = render(
      <CookieConsentBanner
        config={{ ...minimalConfig(), onChange: () => {} }}
      />
    );
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });

    rerender(
      <CookieConsentBanner config={{ ...minimalConfig(), onChange: added }} />
    );
    await Promise.resolve();

    run.mock.calls[0][0].onChange({ changedCategories: ['analytics'] });
    expect(added).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------
  // CDN base URL normalisation (#1246)
  // --------------------------------------------------

  it('de-duplicates against a cdnBaseUrl given with a trailing slash', async () => {
    const seeded = document.createElement('script');
    seeded.src = `${CDN_BASE}/cookieconsent-undrr.js`;
    document.head.appendChild(seeded);

    installLoader();
    render(<CookieConsentBanner cdnBaseUrl={`${CDN_BASE}/`} />);

    await waitFor(() => expect(run).toHaveBeenCalled(), { timeout: 3000 });

    // `…/v1//cookieconsent-undrr.js` is the same file, and a second copy of it
    // still throws a redeclaration error on the page.
    expect(resourcesNamed('cookieconsent-undrr.js')).toHaveLength(1);
  });

  // --------------------------------------------------
  // Fallback path guards (#1245)
  // --------------------------------------------------

  it('reports rather than throws when the library is missing in the last-resort fallback', async () => {
    delete window.CookieConsent;
    installLoader({ fail: true });

    render(<CookieConsentBanner forceFallback />);

    await waitFor(
      () =>
        expect(console.error).toHaveBeenCalledWith(
          'CookieConsent library not available for minimal fallback config'
        ),
      { timeout: 3000 }
    );
  });
});
