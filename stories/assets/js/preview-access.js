// mg-preview-access
// Soft preview gate for unfinished UNDRR pages.
//
// The presence of an element with [data-mg-preview-access] in the body
// activates the gate. CSS hides the page on parse via :has(); this script
// layers a modal over it and asks for a PIN. On success, the gate is marked
// unlocked and the unlock is persisted in sessionStorage.
//
// Not a security mechanism. The PIN lives in the DOM. Treat this as a
// "wet paint" sign: strong, unmissable, but trivial to bypass for anyone
// who wants to. If a page genuinely must not be seen, gate it at the edge
// (for example, Cloudflare Access).

const DEFAULTS = {
  pin: '5498',
  eyebrow: 'UNDRR · Preview',
  title: 'Preview access required',
  message:
    'This page is in preview and is not yet ready for general distribution. ' +
    'Please enter the access PIN provided by UNDRR to continue.',
  contactUrl: 'https://www.undrr.org/contact-us',
  contactLabel: 'Need help? Contact UNDRR',
  pinLabel: 'Access PIN',
  submitLabel: 'Unlock',
  errorMessage: 'That PIN is not correct. Please try again.',
};

const STORAGE_PREFIX = 'mg-preview-access:';
const TITLE_ID = 'mg-preview-access-title';
const BODY_ID = 'mg-preview-access-body';
const ERROR_ID = 'mg-preview-access-error';
const INPUT_ID = 'mg-preview-access-pin';

// Schemes allowed for the contact URL. Anything else (javascript:, data:, etc.)
// is rejected to the default UNDRR contact page.
const SAFE_URL_SCHEMES = ['http:', 'https:', 'mailto:'];

// Module-scoped registry of overlays and the elements that previously held focus.
// WeakMap keyed by gate avoids stashing DOM-side expandos and lets the entries
// drop when a gate is detached and unreferenced.
const overlays = new WeakMap();
const previousFocus = new WeakMap();

/**
 * Validate that a contact URL uses an allow-listed scheme. Returns the URL
 * string when safe; falls back to the default contact page otherwise.
 */
function safeContactUrl(value) {
  if (!value) return DEFAULTS.contactUrl;
  try {
    const url = new URL(value, window.location.href);
    if (SAFE_URL_SCHEMES.includes(url.protocol)) return value;
  } catch (e) {
    // Fall through to default.
  }
  return DEFAULTS.contactUrl;
}

function readConfig(el) {
  return {
    id:
      el.getAttribute('data-mg-preview-id') ||
      (typeof window !== 'undefined' ? window.location.pathname : 'default'),
    pin: el.getAttribute('data-mg-preview-pin') || DEFAULTS.pin,
    eyebrow: el.getAttribute('data-mg-preview-eyebrow') || DEFAULTS.eyebrow,
    title: el.getAttribute('data-mg-preview-title') || DEFAULTS.title,
    message: el.getAttribute('data-mg-preview-message') || DEFAULTS.message,
    contactUrl: safeContactUrl(el.getAttribute('data-mg-preview-contact-url')),
    contactLabel:
      el.getAttribute('data-mg-preview-contact-label') || DEFAULTS.contactLabel,
    pinLabel: el.getAttribute('data-mg-preview-pin-label') || DEFAULTS.pinLabel,
    submitLabel:
      el.getAttribute('data-mg-preview-submit-label') || DEFAULTS.submitLabel,
    errorMessage:
      el.getAttribute('data-mg-preview-error-message') ||
      DEFAULTS.errorMessage,
  };
}

function isUnlocked(id) {
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + id) === 'unlocked';
  } catch (e) {
    return false;
  }
}

function persistUnlock(id) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + id, 'unlocked');
  } catch (e) {
    // Private mode etc. — best effort.
  }
}

function markUnlocked(gate) {
  gate.classList.add('mg-preview-access--unlocked');
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

function buildOverlay(config) {
  const overlay = document.createElement('div');
  overlay.className = 'mg-preview-access__overlay';

  // role="dialog" and the labelling/description references live on the modal
  // panel, not the overlay scrim — the scrim is presentational.
  overlay.innerHTML =
    `<div class="mg-preview-access__modal" role="dialog" aria-modal="true" ` +
      `aria-labelledby="${TITLE_ID}" aria-describedby="${BODY_ID}">` +
      `<p class="mg-preview-access__eyebrow">${escapeText(config.eyebrow)}</p>` +
      `<h2 class="mg-preview-access__title" id="${TITLE_ID}">${escapeText(config.title)}</h2>` +
      `<p class="mg-preview-access__body" id="${BODY_ID}">${escapeText(config.message)}</p>` +
      `<form class="mg-preview-access__form" novalidate>` +
        `<label class="mg-preview-access__label" for="${INPUT_ID}">${escapeText(config.pinLabel)}</label>` +
        `<div class="mg-preview-access__field">` +
          `<input class="mg-preview-access__input" id="${INPUT_ID}" ` +
            `type="text" inputmode="numeric" autocomplete="off" ` +
            `autocapitalize="off" spellcheck="false" ` +
            `aria-describedby="${ERROR_ID}" />` +
          `<button class="mg-preview-access__submit" type="submit">${escapeText(config.submitLabel)}</button>` +
        `</div>` +
        // role="alert" implies aria-live="assertive" + aria-atomic="true"; do
        // not also set aria-live, that creates undefined behaviour.
        `<p class="mg-preview-access__error" id="${ERROR_ID}" role="alert"></p>` +
      `</form>` +
      `<p class="mg-preview-access__contact">` +
        `<a href="${escapeText(config.contactUrl)}">${escapeText(config.contactLabel)}</a>` +
      `</p>` +
    `</div>`;

  return overlay;
}

/**
 * Set/unset `inert` on every direct child of <body> except the overlay.
 * Snapshots the children up front so subsequent DOM mutations cannot skew
 * the iteration. `inert` already implies aria-hidden for assistive tech,
 * so the redundant aria-hidden writes are intentionally omitted (ARIA 1.2).
 */
function setSiblingsInert(overlay, on) {
  Array.from(document.body.children).forEach(child => {
    if (child === overlay) return;
    if (on) {
      child.setAttribute('inert', '');
    } else {
      child.removeAttribute('inert');
    }
  });
}

function unlockGate(gate, overlay, config) {
  persistUnlock(config.id);
  markUnlocked(gate);
  setSiblingsInert(overlay, false);
  overlay.remove();
  overlays.delete(gate);

  // Return focus to a known landmark so keyboard and screen reader users are
  // not dropped on document.body with no announcement of the state change.
  // The previously focused element (often body itself before mount) is the
  // safest fallback; otherwise focus the now-revealed <main> or first heading.
  const restore =
    previousFocus.get(gate) ||
    document.querySelector('main, [role="main"]') ||
    document.querySelector('h1, h2') ||
    document.body;
  previousFocus.delete(gate);
  if (restore && typeof restore.focus === 'function') {
    if (restore === document.body && !restore.hasAttribute('tabindex')) {
      restore.setAttribute('tabindex', '-1');
    }
    restore.focus({ preventScroll: true });
  }
}

function bindHandlers(overlay, gate, config) {
  const form = overlay.querySelector('.mg-preview-access__form');
  const input = overlay.querySelector('.mg-preview-access__input');
  const error = overlay.querySelector('.mg-preview-access__error');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const value = (input.value || '').trim();
    if (value === String(config.pin)) {
      unlockGate(gate, overlay, config);
    } else {
      error.textContent = config.errorMessage;
      input.select();
    }
  });

  // Clear the error only when the input has a value; avoids flicker while the
  // user is mid-correction and re-entering the same first character.
  input.addEventListener('input', () => {
    if (error.textContent && input.value) error.textContent = '';
  });
}

/**
 * Initialise preview-access gates.
 *
 * @param {NodeList|HTMLElement[]|HTMLElement} [scope] - Elements to init.
 *   Accepts a NodeList, array, or single HTMLElement. Defaults to the first
 *   [data-mg-preview-access] in the document.
 */
export function mgPreviewAccess(scope) {
  let gates;
  if (scope) {
    gates = scope instanceof HTMLElement ? [scope] : Array.from(scope);
  } else {
    const first = document.querySelector('[data-mg-preview-access]');
    gates = first ? [first] : [];
  }

  gates.forEach(gate => {
    if (!scope && gate.hasAttribute('data-mg-preview-access-skip-auto-init')) return;
    if (gate.dataset.mgPreviewAccessInitialized) return;
    gate.dataset.mgPreviewAccessInitialized = 'true';

    const config = readConfig(gate);

    if (isUnlocked(config.id)) {
      markUnlocked(gate);
      return;
    }

    // Capture whoever currently has focus so we can restore it on unlock.
    previousFocus.set(
      gate,
      document.activeElement && document.activeElement !== document.body
        ? document.activeElement
        : null,
    );

    const overlay = buildOverlay(config);
    document.body.appendChild(overlay);
    setSiblingsInert(overlay, true);
    bindHandlers(overlay, gate, config);
    overlays.set(gate, overlay);

    // Move focus into the modal once layout settles.
    requestAnimationFrame(() => {
      const input = overlay.querySelector('.mg-preview-access__input');
      if (input) input.focus();
    });
  });
}

/**
 * Tear down a preview-access gate. Removes the overlay (if still mounted),
 * restores body siblings, and clears the init flag.
 *
 * @param {HTMLElement} gate - The [data-mg-preview-access] element.
 */
export function mgPreviewAccessDestroy(gate) {
  if (!gate) return;
  const overlay = overlays.get(gate);
  if (overlay && overlay.parentNode) {
    setSiblingsInert(overlay, false);
    overlay.remove();
  }
  overlays.delete(gate);
  previousFocus.delete(gate);
  delete gate.dataset.mgPreviewAccessInitialized;
  gate.classList.remove('mg-preview-access--unlocked');
}

// Expose for manual re-init (for example, SPA route changes), matching the
// mgShowMore / mgOnThisPageNav vanilla utility pattern.
if (typeof window !== 'undefined') {
  window.mgPreviewAccess = mgPreviewAccess;
}

// Auto-init only when a gate is already in the document. The guard prevents
// the side effect of attaching an overlay if the module is imported by a
// React/Storybook consumer that has not yet rendered (or may never render) a
// real gate.
function autoInit() {
  if (
    typeof document !== 'undefined' &&
    document.querySelector('[data-mg-preview-access]')
  ) {
    mgPreviewAccess();
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}
