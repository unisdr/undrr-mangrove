import { mgCopyButton } from '../copy-button';

describe('mgCopyButton (Vanilla JS Script)', () => {
  let writeTextMock;

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();

    writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function createButton(attrs = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'mg-button mg-button-primary mg-button-outline mg-button--icon mg-copy-button';
    btn.setAttribute('data-mg-copy-button', '');
    Object.entries(attrs).forEach(([key, val]) => {
      btn.setAttribute(`data-${key}`, val);
    });

    btn.innerHTML = `
      <span class="mg-icon mg-icon-copy mg-button__icon" aria-hidden="true"></span>
      <span class="mg-copy-button__feedback" role="status" aria-hidden="true">Copied!</span>
      <span class="mg-u-sr-only" aria-live="polite"></span>
    `;

    document.body.appendChild(btn);
    return btn;
  }

  it('initializes buttons and writes to clipboard on click', async () => {
    const btn = createButton({
      'text-to-copy': 'https://preventionweb.net',
      'tooltip-label': 'Copied!',
      'copied-label': 'URL copied to clipboard.',
    });

    mgCopyButton(btn);

    // Trigger click
    btn.click();
    await Promise.resolve();

    expect(writeTextMock).toHaveBeenCalledWith('https://preventionweb.net');
    expect(btn.classList.contains('mg-copy-button--copied')).toBe(true);

    const feedback = btn.querySelector('.mg-copy-button__feedback');
    expect(
      feedback.classList.contains('mg-copy-button__feedback--visible')
    ).toBe(true);
    expect(feedback.textContent).toBe('Copied!');

    const liveRegion = btn.querySelector('.mg-u-sr-only');
    expect(liveRegion.textContent).toBe('URL copied to clipboard.');

    // Fast-forward 2 seconds
    jest.advanceTimersByTime(2000);

    expect(btn.classList.contains('mg-copy-button--copied')).toBe(false);
    expect(
      feedback.classList.contains('mg-copy-button__feedback--visible')
    ).toBe(false);
    expect(liveRegion.textContent).toBe('');
  });

  it('guards against duplicate initialization', () => {
    const btn = createButton({ 'text-to-copy': 'Single' });

    mgCopyButton(btn);
    expect(btn.dataset.mgCopyButtonInitialized).toBe('true');

    // Second call does not double-bind
    mgCopyButton(btn);
    expect(btn.dataset.mgCopyButtonInitialized).toBe('true');
  });

  it('supports initializing via container elements or document', async () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="card">
        <button type="button" class="mg-button mg-copy-button" data-mg-copy-button data-text-to-copy="https://nested.org">
          <span class="mg-icon mg-icon-copy mg-button__icon"></span>
          <span class="mg-copy-button__feedback">Copied!</span>
          <span class="mg-u-sr-only"></span>
        </button>
      </div>
    `;
    document.body.appendChild(container);

    mgCopyButton(container);

    const btn = container.querySelector('[data-mg-copy-button]');
    expect(btn.dataset.mgCopyButtonInitialized).toBe('true');

    btn.click();
    await Promise.resolve();

    expect(writeTextMock).toHaveBeenCalledWith('https://nested.org');
  });
});
