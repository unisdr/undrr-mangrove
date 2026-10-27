import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ErrorPage } from '../ErrorPage';

expect.extend(toHaveNoViolations);

const STATIC_DIR = path.resolve(__dirname, '../static');
const STATIC_PAGES = fs
  .readdirSync(STATIC_DIR)
  .filter(file => file.endsWith('.html'));

describe('ErrorPage logo link', () => {
  // The logo anchor's only child is an aria-hidden div, so without an explicit
  // label the link has no accessible name at all (axe `link-name`, WCAG 2.4.4
  // / 4.1.2).
  it('names the logo link on the standard error page', () => {
    render(<ErrorPage code={404} showRequestDetails />);
    expect(screen.getByRole('link', { name: 'UNDRR home' })).toHaveAttribute(
      'href',
      'https://www.undrr.org/'
    );
  });

  it('names the logo link on a challenge page', () => {
    render(<ErrorPage variant="challenge" />);
    expect(
      screen.getByRole('link', { name: 'UNDRR home' })
    ).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<ErrorPage code={404} showRequestDetails />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('static Cloudflare templates', () => {
  it('ships all eleven templates', () => {
    expect(STATIC_PAGES).toHaveLength(11);
  });

  // The static pages are served by Cloudflare and are not rendered by React, so
  // nothing else keeps them in step with the component. Every logo anchor in
  // them must carry the same accessible name the component renders.
  it.each(STATIC_PAGES)('%s names its UNDRR logo link', file => {
    const html = fs.readFileSync(path.join(STATIC_DIR, file), 'utf8');
    const logoAnchors = html.match(/<a\b[^>]*>\s*<div class="undrr-logo"/g);

    expect(logoAnchors).not.toBeNull();
    logoAnchors.forEach(anchor => {
      expect(anchor).toContain('aria-label="UNDRR home"');
    });
  });
});
