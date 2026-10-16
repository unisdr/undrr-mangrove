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
    localStorage.clear();
  } catch (e) {
    // ignore
  }
  jest.restoreAllMocks();
});

describe('PreviewAccess (static preview)', () => {
  it('renders the modal markup with default copy', () => {
    render(<PreviewAccess />);
    expect(screen.getByText('Preview access required')).toBeInTheDocument();
    expect(screen.getByLabelText('Access PIN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unlock' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Need help/i })).toHaveAttribute(
      'href',
      'https://www.undrr.org/contact-us'
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
      />
    );
    expect(screen.getByText('DELTA · Preview')).toBeInTheDocument();
    expect(screen.getByText('This page is a preview')).toBeInTheDocument();
    expect(screen.getByText('Custom body copy.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Email DELTA team' })
    ).toBeInTheDocument();
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
    expect(dialog.querySelector('.mg-preview-access__title').textContent).toBe(
      'Custom title'
    );
    expect(dialog.querySelector('.mg-preview-access__title').tagName).toBe(
      'H2'
    );
    expect(
      dialog.querySelector('.mg-preview-access__eyebrow').textContent
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
      'unlocked'
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

    expect(error.textContent).toBe(
      'That PIN is not correct. Please try again.'
    );
    expect(document.querySelector('.mg-preview-access__overlay')).toBeTruthy();
    expect(gate.classList.contains('mg-preview-access--unlocked')).toBe(false);
  });

  it('clears the error when the user types a non-empty value', () => {
    const gate = mountGate({
      'data-mg-preview-id': 'test-clear',
      'data-mg-preview-pin': '1',
    });
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
      expect(
        document.querySelector('.mg-preview-access__overlay')
      ).toBeTruthy();
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  it('applies inert (without aria-hidden) to body siblings while the overlay is up', () => {
    const sibling = document.createElement('main');
    document.body.appendChild(sibling);
    const gate = mountGate({
      'data-mg-preview-id': 'test-inert',
      'data-mg-preview-pin': '1',
    });
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
    expect(
      document.querySelectorAll('.mg-preview-access__overlay').length
    ).toBe(1);
  });

  it('rejects javascript: contact URLs and falls back to the UNDRR contact page', () => {
    const gate = mountGate({
      'data-mg-preview-id': 'test-xss',
      // Deliberate unsafe URL: the assertion below is that it is rejected.
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
    [
      'https://example.org/help',
      'http://example.org/help',
      'mailto:help@undrr.org',
    ].forEach((url, i) => {
      document.body.innerHTML = '';
      const gate = mountGate({
        'data-mg-preview-id': `test-scheme-${i}`,
        'data-mg-preview-contact-url': url,
      });
      mgPreviewAccess([gate]);
      const link = document.querySelector('.mg-preview-access__contact a');
      expect(link.getAttribute('href')).toBe(url);
    });
  });
});

describe('mgPreviewAccess persistence, unlock event and focus', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  function mountGate(attrs = {}) {
    const gate = document.createElement('div');
    gate.setAttribute('data-mg-preview-access', '');
    Object.entries(attrs).forEach(([k, v]) => gate.setAttribute(k, v));
    document.body.insertBefore(gate, document.body.firstChild);
    return gate;
  }

  function enterPin(pin) {
    document.querySelector('.mg-preview-access__input').value = pin;
    fireEvent.submit(document.querySelector('.mg-preview-access__form'));
  }

  // A new page load in another tab: fresh DOM, fresh module state for the
  // gate, empty sessionStorage. localStorage survives.
  function simulateNewTab(gate) {
    mgPreviewAccessDestroy(gate);
    document.body.innerHTML = '';
    sessionStorage.clear();
  }

  it('defaults to session persistence, as before', () => {
    const gate = mountGate({
      'data-mg-preview-id': 'persist-default',
      'data-mg-preview-pin': '1234',
    });
    mgPreviewAccess([gate]);
    enterPin('1234');

    expect(sessionStorage.getItem('mg-preview-access:persist-default')).toBe(
      'unlocked'
    );
    expect(
      localStorage.getItem('mg-preview-access:persist-default')
    ).toBeNull();

    simulateNewTab(gate);
    const next = mountGate({
      'data-mg-preview-id': 'persist-default',
      'data-mg-preview-pin': '1234',
    });
    mgPreviewAccess([next]);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeTruthy();
  });

  it('treats an unknown persist value as session', () => {
    const gate = mountGate({
      'data-mg-preview-id': 'persist-bogus',
      'data-mg-preview-pin': '1',
      'data-mg-preview-persist': 'forever',
    });
    mgPreviewAccess([gate]);
    enterPin('1');
    expect(sessionStorage.getItem('mg-preview-access:persist-bogus')).toBe(
      'unlocked'
    );
    expect(localStorage.getItem('mg-preview-access:persist-bogus')).toBeNull();
  });

  it('keeps a local unlock across a new tab or visit', () => {
    const attrs = {
      'data-mg-preview-id': 'persist-local',
      'data-mg-preview-pin': '1234',
      'data-mg-preview-persist': 'local',
    };
    const gate = mountGate(attrs);
    mgPreviewAccess([gate]);
    enterPin('1234');

    const stored = JSON.parse(
      localStorage.getItem('mg-preview-access:persist-local')
    );
    expect(typeof stored.at).toBe('number');
    // The fingerprint, not the PIN itself, is stored.
    expect(stored.pin).not.toBe('1234');
    expect(
      sessionStorage.getItem('mg-preview-access:persist-local')
    ).toBeNull();

    simulateNewTab(gate);
    const next = mountGate(attrs);
    mgPreviewAccess([next]);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeNull();
    expect(next.classList.contains('mg-preview-access--unlocked')).toBe(true);
  });

  it('still honours an existing session unlock when switched to local', () => {
    sessionStorage.setItem('mg-preview-access:persist-upgrade', 'unlocked');
    const gate = mountGate({
      'data-mg-preview-id': 'persist-upgrade',
      'data-mg-preview-persist': 'local',
    });
    mgPreviewAccess([gate]);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeNull();
    expect(gate.classList.contains('mg-preview-access--unlocked')).toBe(true);
  });

  it('falls back to session storage when localStorage cannot be written', () => {
    const gate = mountGate({
      'data-mg-preview-id': 'persist-fallback',
      'data-mg-preview-pin': '1',
      'data-mg-preview-persist': 'local',
    });
    mgPreviewAccess([gate]);
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key, value) {
      if (this === window.localStorage) throw new Error('QuotaExceededError');
      return original.call(this, key, value);
    };
    try {
      enterPin('1');
    } finally {
      Storage.prototype.setItem = original;
    }
    expect(gate.classList.contains('mg-preview-access--unlocked')).toBe(true);
    expect(sessionStorage.getItem('mg-preview-access:persist-fallback')).toBe(
      'unlocked'
    );
  });

  it('expires a local unlock older than max-age and removes it', () => {
    const attrs = {
      'data-mg-preview-id': 'persist-expiry',
      'data-mg-preview-pin': '1234',
      'data-mg-preview-persist': 'local',
      'data-mg-preview-max-age': '7',
    };
    const start = Date.UTC(2026, 9, 1);
    const now = jest.spyOn(Date, 'now').mockReturnValue(start);

    const gate = mountGate(attrs);
    mgPreviewAccess([gate]);
    enterPin('1234');

    // Six days later: still unlocked.
    now.mockReturnValue(start + 6 * DAY_MS);
    simulateNewTab(gate);
    const sixDays = mountGate(attrs);
    mgPreviewAccess([sixDays]);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeNull();

    // Eight days later: locked again, and the stale entry is gone.
    now.mockReturnValue(start + 8 * DAY_MS);
    simulateNewTab(sixDays);
    const eightDays = mountGate(attrs);
    mgPreviewAccess([eightDays]);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeTruthy();
    expect(eightDays.classList.contains('mg-preview-access--unlocked')).toBe(
      false
    );
    expect(localStorage.getItem('mg-preview-access:persist-expiry')).toBeNull();
  });

  it('relocks a local unlock when the PIN changes', () => {
    const attrs = {
      'data-mg-preview-id': 'persist-pin-change',
      'data-mg-preview-pin': '1234',
      'data-mg-preview-persist': 'local',
    };
    const gate = mountGate(attrs);
    mgPreviewAccess([gate]);
    enterPin('1234');

    simulateNewTab(gate);
    const next = mountGate({ ...attrs, 'data-mg-preview-pin': '9999' });
    mgPreviewAccess([next]);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeTruthy();
    expect(
      localStorage.getItem('mg-preview-access:persist-pin-change')
    ).toBeNull();
  });

  it('ignores a malformed local entry', () => {
    localStorage.setItem('mg-preview-access:persist-junk', 'unlocked');
    const gate = mountGate({
      'data-mg-preview-id': 'persist-junk',
      'data-mg-preview-persist': 'local',
    });
    mgPreviewAccess([gate]);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeTruthy();
  });

  it('dispatches a bubbling unlock event when the PIN is entered', () => {
    const listener = jest.fn();
    document.addEventListener('mg-preview-access:unlock', listener);
    try {
      const gate = mountGate({
        'data-mg-preview-id': 'event-pin',
        'data-mg-preview-pin': '1',
        'data-mg-preview-persist': 'local',
      });
      mgPreviewAccess([gate]);
      expect(listener).not.toHaveBeenCalled();
      enterPin('1');

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0];
      expect(event.target).toBe(gate);
      expect(event.detail).toEqual({
        id: 'event-pin',
        persist: 'local',
        source: 'pin',
      });
      // Listeners see the final state.
      expect(gate.classList.contains('mg-preview-access--unlocked')).toBe(true);
      expect(document.querySelector('.mg-preview-access__overlay')).toBeNull();
    } finally {
      document.removeEventListener('mg-preview-access:unlock', listener);
    }
  });

  it('does not dispatch the unlock event on a wrong PIN', () => {
    const listener = jest.fn();
    document.addEventListener('mg-preview-access:unlock', listener);
    try {
      const gate = mountGate({
        'data-mg-preview-id': 'event-wrong',
        'data-mg-preview-pin': '1',
      });
      mgPreviewAccess([gate]);
      enterPin('2');
      expect(listener).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('mg-preview-access:unlock', listener);
    }
  });

  it('dispatches the unlock event when restored from storage', () => {
    sessionStorage.setItem('mg-preview-access:event-storage', 'unlocked');
    const listener = jest.fn();
    document.addEventListener('mg-preview-access:unlock', listener);
    try {
      const gate = mountGate({ 'data-mg-preview-id': 'event-storage' });
      mgPreviewAccess([gate]);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].detail).toEqual({
        id: 'event-storage',
        persist: 'session',
        source: 'storage',
      });
    } finally {
      document.removeEventListener('mg-preview-access:unlock', listener);
    }
  });

  it('moves focus to <main> after unlock, not <body>', () => {
    const main = document.createElement('main');
    main.innerHTML = '<h1>Report</h1>';
    document.body.appendChild(main);
    const gate = mountGate({
      'data-mg-preview-id': 'focus-main',
      'data-mg-preview-pin': '1',
    });
    // The gate mounts while body has focus, as it does on page load.
    expect(document.activeElement).toBe(document.body);
    mgPreviewAccess([gate]);
    enterPin('1');

    expect(document.activeElement).toBe(main);
    expect(main.getAttribute('tabindex')).toBe('-1');

    // The temporary tabindex goes once focus moves on.
    main.blur();
    expect(main.hasAttribute('tabindex')).toBe(false);
  });

  it('keeps an author-set tabindex on <main>', () => {
    const main = document.createElement('main');
    main.setAttribute('tabindex', '0');
    document.body.appendChild(main);
    const gate = mountGate({
      'data-mg-preview-id': 'focus-main-tabindex',
      'data-mg-preview-pin': '1',
    });
    mgPreviewAccess([gate]);
    enterPin('1');
    expect(document.activeElement).toBe(main);
    main.blur();
    expect(main.getAttribute('tabindex')).toBe('0');
  });

  it('falls back to the #main skip-link target, then the first h1', () => {
    const target = document.createElement('div');
    target.id = 'main';
    document.body.appendChild(target);
    let gate = mountGate({
      'data-mg-preview-id': 'focus-skip',
      'data-mg-preview-pin': '1',
    });
    mgPreviewAccess([gate]);
    enterPin('1');
    expect(document.activeElement).toBe(target);

    mgPreviewAccessDestroy(gate);
    document.body.innerHTML = '<div><h2>Sub</h2><h1>Title</h1></div>';
    gate = mountGate({
      'data-mg-preview-id': 'focus-h1',
      'data-mg-preview-pin': '1',
    });
    mgPreviewAccess([gate]);
    enterPin('1');
    expect(document.activeElement.tagName).toBe('H1');
  });

  it('returns focus to a previously focused element when there was one', () => {
    const main = document.createElement('main');
    const button = document.createElement('button');
    button.textContent = 'Open';
    main.appendChild(button);
    document.body.appendChild(main);
    button.focus();

    const gate = mountGate({
      'data-mg-preview-id': 'focus-previous',
      'data-mg-preview-pin': '1',
    });
    mgPreviewAccess([gate]);
    enterPin('1');
    expect(document.activeElement).toBe(button);
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

  it('passes persist and maxAge through as data attributes', () => {
    const { container } = render(
      <PreviewAccess live id="rtl-persist" persist="local" maxAge={30} />
    );
    const gate = container.querySelector('[data-mg-preview-access]');
    expect(gate).toHaveAttribute('data-mg-preview-persist', 'local');
    expect(gate).toHaveAttribute('data-mg-preview-max-age', '30');
  });

  it('defaults persist to session and omits max-age', () => {
    const { container } = render(<PreviewAccess live id="rtl-default" />);
    const gate = container.querySelector('[data-mg-preview-access]');
    expect(gate).toHaveAttribute('data-mg-preview-persist', 'session');
    expect(gate).not.toHaveAttribute('data-mg-preview-max-age');
  });
});
