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

  it('tears down with reset(true) and never calls a destroy() the library does not have', async () => {
    const destroy = jest.fn();
    window.CookieConsent = { run, reset, destroy };

    installLoader();
    const { unmount } = render(<CookieConsentBanner />);
    await waitFor(() => expect(run).toHaveBeenCalled(), { timeout: 3000 });

    unmount();

    expect(reset).toHaveBeenCalledWith(true);
    expect(destroy).not.toHaveBeenCalled();
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
    expect(reset).toHaveBeenCalledWith(true);
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
