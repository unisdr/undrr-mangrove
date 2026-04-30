// mg-preview-access
// Soft preview gate for unfinished UNDRR pages.
//
// The presence of an element with [data-mg-preview-access] in the body
// activates the gate. CSS hides the page on parse via :has(); this script
// layers a modal on top asking for a PIN. On success, the gate is marked
// unlocked and the unlock is persisted in sessionStorage.
//
// Not a security mechanism. The PIN lives in the DOM. Treat this as a
// "wet paint" sign — strong, unmissable, but trivial to bypass for anyone
// who wants to. If a page genuinely must not be seen, gate it at the edge
// (e.g., Cloudflare Access).

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

function readConfig(el) {
  return {
    id:
      el.getAttribute('data-mg-preview-id') ||
      (typeof window !== 'undefined' ? window.location.pathname : 'default'),
    pin: el.getAttribute('data-mg-preview-pin') || DEFAULTS.pin,
    eyebrow: el.getAttribute('data-mg-preview-eyebrow') || DEFAULTS.eyebrow,
    title: el.getAttribute('data-mg-preview-title') || DEFAULTS.title,
    message: el.getAttribute('data-mg-preview-message') || DEFAULTS.message,
    contactUrl:
      el.getAttribute('data-mg-preview-contact-url') || DEFAULTS.contactUrl,
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
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', TITLE_ID);
  overlay.setAttribute('aria-describedby', BODY_ID);

  overlay.innerHTML =
    `<div class="mg-preview-access__modal">` +
      `<p class="mg-preview-access__eyebrow">${escapeText(config.eyebrow)}</p>` +
      `<h1 class="mg-preview-access__title" id="${TITLE_ID}">${escapeText(config.title)}</h1>` +
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
        `<p class="mg-preview-access__error" id="${ERROR_ID}" role="alert" aria-live="polite"></p>` +
      `</form>` +
      `<p class="mg-preview-access__contact">` +
        `<a href="${escapeText(config.contactUrl)}">${escapeText(config.contactLabel)}</a>` +
      `</p>` +
    `</div>`;

  return overlay;
}

/**
 * Set/unset `inert` on every direct child of <body> except the overlay.
 * Gives focus-trapping, screen-reader hiding, and pointer-blocking in one.
 */
function setSiblingsInert(overlay, on) {
  const children = document.body.children;
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    if (child === overlay) continue;
    if (on) {
      child.setAttribute('inert', '');
      child.setAttribute('aria-hidden', 'true');
    } else {
      child.removeAttribute('inert');
      child.removeAttribute('aria-hidden');
    }
  }
}

function unlockGate(gate, overlay, config) {
  persistUnlock(config.id);
  markUnlocked(gate);
  setSiblingsInert(overlay, false);
  overlay.remove();
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

  input.addEventListener('input', () => {
    if (error.textContent) error.textContent = '';
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

    const overlay = buildOverlay(config);
    document.body.appendChild(overlay);
    setSiblingsInert(overlay, true);
    bindHandlers(overlay, gate, config);
    gate._mgPreviewAccessOverlay = overlay;

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
  const overlay = gate._mgPreviewAccessOverlay;
  if (overlay && overlay.parentNode) {
    setSiblingsInert(overlay, false);
    overlay.remove();
  }
  gate._mgPreviewAccessOverlay = null;
  delete gate.dataset.mgPreviewAccessInitialized;
  gate.classList.remove('mg-preview-access--unlocked');
}

// Expose for manual re-init (e.g., SPA route changes), matching the
// mgShowMore / mgOnThisPageNav vanilla utility pattern.
if (typeof window !== 'undefined') {
  window.mgPreviewAccess = mgPreviewAccess;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mgPreviewAccess());
  } else {
    mgPreviewAccess();
  }
}
