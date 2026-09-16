// mg-copy-button
// Zero-dependency vanilla JS copy-to-clipboard button initializer.

/**
 * Initializes standalone copy buttons without requiring React.
 *
 * Expected HTML:
 * <button type="button" class="mg-button mg-button-primary mg-button-outline mg-button--icon mg-copy-button"
 *   data-mg-copy-button
 *   data-text-to-copy="https://example.org"
 *   data-tooltip-label="Copied!"
 *   data-copied-label="Copied to clipboard."
 *   data-failed-tooltip-label="Copy failed"
 *   data-failed-label="Copy failed. Select the text and copy it manually.">
 *   <span class="mg-icon mg-icon-copy mg-button__icon" aria-hidden="true"></span>
 *   <span class="mg-copy-button__feedback" aria-hidden="true">Copied!</span>
 *   <span class="mg-u-sr-only" aria-live="polite"></span>
 * </button>
 *
 * @param {NodeList|HTMLElement[]|HTMLElement|Document} [scope] - Elements or container to search within.
 */
function buttonsIn(scope = document) {
  if (!scope) return [];
  if (!scope.querySelectorAll) return Array.from(scope).flatMap(buttonsIn);
  return [
    ...(scope.matches?.('[data-mg-copy-button]') ? [scope] : []),
    ...scope.querySelectorAll('[data-mg-copy-button]'),
  ];
}

export function mgCopyButton(scope) {
  const elements = buttonsIn(scope);

  elements.forEach(button => {
    // Guard against double initialization
    if (button.dataset.mgCopyButtonInitialized) return;
    button.dataset.mgCopyButtonInitialized = 'true';

    let timer = null;

    button.addEventListener('click', async () => {
      const textToCopy =
        button.dataset.textToCopy ||
        button.dataset.text ||
        button.dataset.copyText ||
        '';
      const tooltipLabel =
        button.dataset.tooltipLabel || button.dataset.feedbackText || 'Copied!';
      const copiedLabel =
        button.dataset.copiedLabel ||
        button.dataset.ariaLiveText ||
        'Copied to clipboard.';

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          // Fallback for older browsers / non-HTTPS contexts
          const textArea = document.createElement('textarea');
          textArea.value = textToCopy;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }

        // Apply visual copied feedback
        button.classList.add('mg-copy-button--copied');

        const feedbackEl = button.querySelector('.mg-copy-button__feedback');
        if (feedbackEl) {
          feedbackEl.textContent = tooltipLabel;
          feedbackEl.classList.add('mg-copy-button__feedback--visible');
        }

        // Apply screen-reader announcement
        const liveRegion = button.querySelector('.mg-u-sr-only');
        if (liveRegion) {
          liveRegion.textContent = copiedLabel;
        }

        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          button.classList.remove('mg-copy-button--copied');
          if (feedbackEl) {
            feedbackEl.classList.remove('mg-copy-button__feedback--visible');
          }
          if (liveRegion) {
            liveRegion.textContent = '';
          }
        }, 2000);
      } catch (err) {
        console.error('[mg-copy-button] Failed to copy text:', err);

        const feedbackEl = button.querySelector('.mg-copy-button__feedback');
        if (feedbackEl) {
          feedbackEl.textContent =
            button.dataset.failedTooltipLabel || 'Copy failed';
          feedbackEl.classList.add(
            'mg-copy-button__feedback--visible',
            'mg-copy-button__feedback--error'
          );
        }
        const liveRegion = button.querySelector('.mg-u-sr-only');
        if (liveRegion) {
          liveRegion.textContent =
            button.dataset.failedLabel ||
            'Copy failed. Select the text and copy it manually.';
        }

        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (feedbackEl) {
            feedbackEl.classList.remove(
              'mg-copy-button__feedback--visible',
              'mg-copy-button__feedback--error'
            );
          }
          if (liveRegion) liveRegion.textContent = '';
        }, 5000);
      }
    });
  });
}

// Auto-initialize when loaded as a standalone script
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mgCopyButton(), false);
  } else {
    mgCopyButton();
  }
}
