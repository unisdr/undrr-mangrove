import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import PreviewAccess from '../PreviewAccess';
import {
  mgPreviewAccess,
  mgPreviewAccessDestroy,
} from '../../../assets/js/preview-access';

beforeAll(() => {
  // jsdom lacks rAF in some environments; route it to a microtask.
  if (typeof window.requestAnimationFrame !== 'function') {
    window.requestAnimationFrame = cb => setTimeout(cb, 0);
  }
});

afterEach(() => {
  // Clean up any lingering overlays and unlocks between tests.
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
    const overlay = document.querySelector('.mg-preview-access__overlay');
    expect(overlay).toBeTruthy();
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.getAttribute('aria-modal')).toBe('true');
    expect(
      overlay.querySelector('.mg-preview-access__title').textContent,
    ).toBe('Custom title');
    expect(
      overlay.querySelector('.mg-preview-access__eyebrow').textContent,
    ).toBe('Custom · Preview');
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

  it('clears the error when the user edits the input', () => {
    const gate = mountGate({ 'data-mg-preview-id': 'test-clear', 'data-mg-preview-pin': '1' });
    mgPreviewAccess([gate]);
    const overlay = document.querySelector('.mg-preview-access__overlay');
    const input = overlay.querySelector('.mg-preview-access__input');
    const form = overlay.querySelector('.mg-preview-access__form');
    const error = overlay.querySelector('.mg-preview-access__error');

    input.value = '0';
    fireEvent.submit(form);
    expect(error.textContent).not.toBe('');

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

  it('applies inert and aria-hidden to body siblings while the overlay is up', () => {
    const sibling = document.createElement('main');
    document.body.appendChild(sibling);
    const gate = mountGate({ 'data-mg-preview-id': 'test-inert', 'data-mg-preview-pin': '1' });
    mgPreviewAccess([gate]);
    expect(sibling.hasAttribute('inert')).toBe(true);
    expect(sibling.getAttribute('aria-hidden')).toBe('true');

    const form = document.querySelector('.mg-preview-access__form');
    document.querySelector('.mg-preview-access__input').value = '1';
    fireEvent.submit(form);

    expect(sibling.hasAttribute('inert')).toBe(false);
    expect(sibling.hasAttribute('aria-hidden')).toBe(false);
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
    // Auto-init path: no scope passed.
    mgPreviewAccess();
    // Auto-init queries the first matching element; with the skip flag, no
    // overlay should be created.
    expect(document.querySelector('.mg-preview-access__overlay')).toBeNull();
    // Explicit init still works.
    mgPreviewAccess([gate]);
    expect(document.querySelector('.mg-preview-access__overlay')).toBeTruthy();
  });
});
