/**
 * @jest-environment node
 */
// Runs without a DOM, so there is nothing for jest-axe to audit here; the
// accessibility assertions live in ServiceNotice.test.jsx.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ServiceNotice } from '../ServiceNotice';

describe('ServiceNotice server rendering', () => {
  it('keeps the status link and its new tab hint without a window', () => {
    expect(typeof window).toBe('undefined');

    const html = renderToStaticMarkup(
      <ServiceNotice title="Down" statusUrl="https://status.example.org" />
    );

    expect(html).toContain('href="https://status.example.org"');
    expect(html).toContain(
      '<span class="mg-u-sr-only">(opens in a new tab)</span>'
    );
  });

  it('still drops unsafe status links', () => {
    const html = renderToStaticMarkup(
      // eslint-disable-next-line no-script-url
      <ServiceNotice title="Down" statusUrl="javascript:alert(1)" />
    );

    expect(html).not.toContain('<a ');
  });
});
