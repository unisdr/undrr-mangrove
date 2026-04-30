import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import PreviewAccess from '../PreviewAccess';
import {
  mgPreviewAccess,
  mgPreviewAccessDestroy,
} from '../../../assets/js/preview-access';

beforeAll(() => {
  if (typeof window.requestAnimationFrame !== 'function') {
    window.requestAnimationFrame = cb => setTimeout(cb, 0);
  }
});

afterEach(() => {
  document.body.innerHTML = '';
  try {
    sessionStorage.clear();
  } catch (e) {
    // ignore
  }
});

describe('PreviewAccess (static preview)', () => {
  it('renders the modal markup with default copy', () => {
    render(<PreviewAccess />);
    expect(screen.getByText('Preview access required')).toBeInTheDocument();
    expect(screen.getByLabelText('Access PIN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unlock' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Need help/i })).toHaveAttribute(
      'href',
      'https://www.undrr.org/contact-us',
    );
  });

  it('uses h2 (not h1) for the modal title to avoid host-page heading conflicts', () => {
    render(<PreviewAccess title="Preview" />);
    const heading = screen.getByText('Preview');
    expect(heading.tagName).toBe('H2');
  });

  it('places dialog semantics on the modal panel, not a wrapper scrim', () => {
    const { container } = render(<PreviewAccess />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog).toHaveClass('mg-preview-access__modal');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('renders custom copy from props', () => {
    render(
      <PreviewAccess
        eyebrow="DELTA · Preview"
        title="This page is a preview"
        message="Custom body copy."
        contactLabel="Email DELTA team"
      />,
    );
    expect(screen.getByText('DELTA · Preview')).toBeInTheDocument();
    expect(screen.getByText('This page is a preview')).toBeInTheDocument();
    expect(screen.getByText('Custom body copy.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email DELTA team' })).toBeInTheDocument();
  });

  it('has no axe violations in the static preview', async () => {
    const { container } = render(<PreviewAccess />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('mgPreviewAccess (vanilla runtime)', () => {
  function mountGate(attrs = {}) {
    const gate = document.createElement('div');
    gate.setAttribute('data-mg-preview-access', '');
    Object.entries(attrs).forEach(([k, v]) => gate.setAttribute(k, v));
    document.body.appendChild(gate);
    return gate;
  }

  it('builds an overlay with the configured copy', () => {
    const gate = mountGate({
      'data-mg-preview-id': 'test-1',
      'data-mg-preview-title': 'Custom title',
      'data-mg-preview-eyebrow': 'Custom · Preview',
    });
    mgPreviewAccess([gate]);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog).toHaveClass('mg-preview-access__modal');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(
      dialog.querySelector('.mg-preview-access__title').textContent,
    ).toBe('Custom title');
    expect(
      dialog.querySelector('.mg-preview-access__title').tagName,
    ).toBe('H2');
    expect(
      dialog.querySelector('.mg-preview-access__eyebrow').textContent,
    ).toBe('Custom · Preview');
  });

  it('uses role=alert without aria-live on the error region', () => {
    const gate = mountGate({ 'data-mg-preview-id': 'test-alert' });
    mgPreviewAccess([gate]);
    const error = document.querySelector('.mg-preview-access__error');
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.hasAttribute('aria-live')).toBe(false);
  });

  it('marks the gate unlocked when the correct PIN is submitted', () => {
    const gate = mountGate({
      'data-mg-preview-id': 'test-unlock',
      'data-mg-preview-pin': '1234',
    });
    mgPreviewAccess([gate]);
    const overlay = document.querySelector('.mg-preview-access__overlay');
    const input = overlay.querySelector('.mg-preview-access__input');
    const form = overlay.querySelector('.mg-preview-access__form');

    input.value = '1234';
    fireEvent.submit(form);

    expect(gate.classList.contains('mg-preview-access--unlocked')).toBe(true);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeNull();
    expect(sessionStorage.getItem('mg-preview-access:test-unlock')).toBe(
      'unlocked',
    );
  });

  it('shows an error and keeps the overlay on a wrong PIN', () => {
    const gate = mountGate({
      'data-mg-preview-id': 'test-wrong',
      'data-mg-preview-pin': '1234',
    });
    mgPreviewAccess([gate]);
    const overlay = document.querySelector('.mg-preview-access__overlay');
    const input = overlay.querySelector('.mg-preview-access__input');
    const form = overlay.querySelector('.mg-preview-access__form');
    const error = overlay.querySelector('.mg-preview-access__error');

    input.value = 'wrong';
    fireEvent.submit(form);

    expect(error.textContent).toBe('That PIN is not correct. Please try again.');
    expect(document.querySelector('.mg-preview-access__overlay')).toBeTruthy();
    expect(gate.classList.contains('mg-preview-access--unlocked')).toBe(false);
  });

  it('clears the error when the user types a non-empty value', () => {
    const gate = mountGate({ 'data-mg-preview-id': 'test-clear', 'data-mg-preview-pin': '1' });
    mgPreviewAccess([gate]);
    const overlay = document.querySelector('.mg-preview-access__overlay');
    const input = overlay.querySelector('.mg-preview-access__input');
    const form = overlay.querySelector('.mg-preview-access__form');
    const error = overlay.querySelector('.mg-preview-access__error');

    input.value = '0';
    fireEvent.submit(form);
    expect(error.textContent).not.toBe('');

    input.value = '01';
    fireEvent.input(input, { target: { value: '01' } });
    expect(error.textContent).toBe('');
  });

  it('skips the modal when sessionStorage already has an unlock', () => {
    sessionStorage.setItem('mg-preview-access:test-skip', 'unlocked');
    const gate = mountGate({ 'data-mg-preview-id': 'test-skip' });
    mgPreviewAccess([gate]);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeNull();
    expect(gate.classList.contains('mg-preview-access--unlocked')).toBe(true);
  });

  it('still mounts the overlay when sessionStorage throws (private mode)', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function throwingGetItem() {
      throw new Error('SecurityError: private mode');
    };
    try {
      const gate = mountGate({ 'data-mg-preview-id': 'test-storage-err' });
      mgPreviewAccess([gate]);
      expect(document.querySelector('.mg-preview-access__overlay')).toBeTruthy();
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  it('applies inert (without aria-hidden) to body siblings while the overlay is up', () => {
    const sibling = document.createElement('main');
    document.body.appendChild(sibling);
    const gate = mountGate({ 'data-mg-preview-id': 'test-inert', 'data-mg-preview-pin': '1' });
    mgPreviewAccess([gate]);
    expect(sibling.hasAttribute('inert')).toBe(true);
    // ARIA 1.2: aria-hidden is redundant when inert is set; we deliberately
    // don't write it. axe also flags aria-hidden on focused-ancestor.
    expect(sibling.hasAttribute('aria-hidden')).toBe(false);

    const form = document.querySelector('.mg-preview-access__form');
    document.querySelector('.mg-preview-access__input').value = '1';
    fireEvent.submit(form);

    expect(sibling.hasAttribute('inert')).toBe(false);
  });

  it('mgPreviewAccessDestroy removes the overlay and clears init', () => {
    const gate = mountGate({ 'data-mg-preview-id': 'test-destroy' });
    mgPreviewAccess([gate]);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeTruthy();

    act(() => mgPreviewAccessDestroy(gate));
    expect(document.querySelector('.mg-preview-access__overlay')).toBeNull();
    expect(gate.dataset.mgPreviewAccessInitialized).toBeUndefined();
  });

  it('does not auto-init an element flagged with skip-auto-init', () => {
    const gate = mountGate({
      'data-mg-preview-id': 'test-skip-auto',
      'data-mg-preview-access-skip-auto-init': '',
    });
    mgPreviewAccess();
    expect(document.querySelector('.mg-preview-access__overlay')).toBeNull();
    mgPreviewAccess([gate]);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeTruthy();
  });

  it('is idempotent — initialising the same gate twice does not stack overlays', () => {
    const gate = mountGate({ 'data-mg-preview-id': 'test-idem' });
    mgPreviewAccess([gate]);
    mgPreviewAccess([gate]);
    expect(document.querySelectorAll('.mg-preview-access__overlay').length).toBe(1);
  });

  it('rejects javascript: contact URLs and falls back to the UNDRR contact page', () => {
    const gate = mountGate({
      'data-mg-preview-id': 'test-xss',
      // eslint-disable-next-line no-script-url
      'data-mg-preview-contact-url': 'javascript:alert(1)',
    });
    mgPreviewAccess([gate]);
    const link = document.querySelector('.mg-preview-access__contact a');
    expect(link.getAttribute('href')).toBe('https://www.undrr.org/contact-us');
  });

  it('rejects data: contact URLs', () => {
    const gate = mountGate({
      'data-mg-preview-id': 'test-data-uri',
      'data-mg-preview-contact-url': 'data:text/html,<script>alert(1)</script>',
    });
    mgPreviewAccess([gate]);
    const link = document.querySelector('.mg-preview-access__contact a');
    expect(link.getAttribute('href')).toBe('https://www.undrr.org/contact-us');
  });

  it('accepts http, https, and mailto contact URLs', () => {
    ['https://example.org/help', 'http://example.org/help', 'mailto:help@undrr.org'].forEach(
      (url, i) => {
        document.body.innerHTML = '';
        const gate = mountGate({
          'data-mg-preview-id': `test-scheme-${i}`,
          'data-mg-preview-contact-url': url,
        });
        mgPreviewAccess([gate]);
        const link = document.querySelector('.mg-preview-access__contact a');
        expect(link.getAttribute('href')).toBe(url);
      },
    );
  });
});

describe('PreviewAccess (live mode)', () => {
  it('mounts the overlay on document.body when live and removes it on unmount', () => {
    const { unmount } = render(<PreviewAccess live id="rtl-live" pin="42" />);
    // Overlay is appended to document.body, not the React tree.
    expect(document.querySelector('.mg-preview-access__overlay')).toBeTruthy();
    unmount();
    expect(document.querySelector('.mg-preview-access__overlay')).toBeNull();
  });
});
