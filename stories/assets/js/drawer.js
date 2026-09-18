// mg-drawer / mg-floating-panel
// Vanilla lifecycle for the off-canvas drawer and the floating panel: open and
// close, Escape, a focus trap for the modal case, focus return, and cleanup.
// See Drawer.mdx. Requested in unisdr/undrr-mangrove#1197.
//
// This module enhances markup you already wrote. It never builds a drawer, and
// it holds no user-visible strings: the close button's accessible name, the
// title and the body all come from your HTML, so translation stays with the
// page that renders it. The one element it creates is the modal backdrop,
// which carries no text.

const DRAWER_SELECTOR = '[data-mg-js-drawer]';
const SKIP_ATTR = 'data-mg-js-drawer-skip-auto-init';
const INITIALISED_ATTR = 'data-mg-js-drawer-initialized';
const TRIGGER_SELECTOR = '[data-mg-drawer-trigger]';
const FLOATING_PANEL_CLASS = 'mg-floating-panel';
const BACKDROP_CLASS = 'mg-drawer__backdrop';

/** Command events a script can dispatch on the container. */
export const OPEN_EVENT = 'mg-drawer:open';
export const CLOSE_EVENT = 'mg-drawer:close';
export const TOGGLE_EVENT = 'mg-drawer:toggle';

/** Notification events the drawer dispatches after it has moved. */
export const OPENED_EVENT = 'mg-drawer:opened';
export const CLOSED_EVENT = 'mg-drawer:closed';

// Same list the React Drawer traps against, so the two agree on what counts as
// focusable.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shared by every copy of this module on the page — a CDN build alongside a
// bundled one, or two versions — so one drawer is never enhanced twice and
// either copy can destroy an instance the other created. The per-element
// dataset flag is what survives that split; a module-scope WeakMap alone would
// not (docs/HYDRATION-AUTHORING.md).
const REGISTRY_KEY = Symbol.for('@undrr/mangrove/drawer@1');
const registry =
  globalThis[REGISTRY_KEY] ||
  (globalThis[REGISTRY_KEY] = { instances: new WeakMap() });

// Used to give an unlabelled drawer title an id so the dialog can point
// `aria-labelledby` at it. The counter lives on `globalThis` so two loaded
// copies of this module share one sequence instead of each minting
// `mg-drawer-title-0`, the same hazard and the same fix as show-more.js.
const TITLE_COUNTER_KEY = Symbol.for('undrr.mangrove.drawer.titleCounter');

/**
 * Mints an id that is unused in `doc`.
 *
 * @param {Document} doc
 * @returns {string} A free `mg-drawer-title-N` id.
 */
function nextTitleId(doc) {
  for (;;) {
    const current = globalThis[TITLE_COUNTER_KEY];
    const next = Number.isSafeInteger(current) && current >= 0 ? current : 0;
    globalThis[TITLE_COUNTER_KEY] = next + 1;
    const id = `mg-drawer-title-${next}`;
    if (!doc.getElementById(id)) return id;
  }
}

/**
 * Every element in `scope` that matches `selector`, including `scope` itself.
 *
 * @param {Document|Element|Iterable<Element>} scope
 * @param {string} selector
 * @returns {Element[]}
 */
function collect(scope, selector) {
  const roots =
    scope && typeof scope[Symbol.iterator] === 'function'
      ? Array.from(scope)
      : [scope || document];
  const found = new Set();
  roots.forEach(root => {
    if (!root) return;
    if (root.matches?.(selector)) found.add(root);
    root.querySelectorAll?.(selector).forEach(element => found.add(element));
  });
  return Array.from(found);
}

/**
 * Whether the container is a floating panel rather than an edge drawer.
 *
 * Read from the class the markup already carries, which is the same signal the
 * React component's `isFloatingPanel` prop sets.
 *
 * @param {Element} container
 * @returns {boolean}
 */
function isFloatingPanel(container) {
  return container.classList.contains(FLOATING_PANEL_CLASS);
}

/**
 * Whether the drawer is modal: an edge drawer with a backdrop. A floating
 * panel is never modal, and `data-backdrop="false"` opts an edge drawer out.
 *
 * @param {Element} container
 * @returns {boolean}
 */
function isModal(container) {
  if (isFloatingPanel(container)) return false;
  return container.getAttribute('data-backdrop') !== 'false';
}

/**
 * Triggers anywhere in the document that point at this container's id.
 *
 * @param {Element} container
 * @returns {Element[]}
 */
function triggersFor(container) {
  if (!container.id) return [];
  return Array.from(
    container.ownerDocument.querySelectorAll(TRIGGER_SELECTOR)
  ).filter(
    trigger => trigger.getAttribute('data-mg-drawer-trigger') === container.id
  );
}

function focusableIn(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    element => !element.closest('[inert]')
  );
}

/**
 * Enhances one drawer container.
 *
 * @param {Element} container
 * @returns {{ open: () => void, close: () => void, toggle: () => void, isOpen: () => boolean, destroy: () => void }}
 */
function enhance(container) {
  const doc = container.ownerDocument;
  const controller = new AbortController();
  const { signal } = controller;
  let open = container.classList.contains('is-open');
  let returnFocusTo = null;
  let backdrop = null;
  let destroyed = false;

  // What the markup looked like before this module touched it, so destroy()
  // can put it back rather than leave a half-managed dialog behind.
  const initial = {
    role: container.getAttribute('role'),
    tabindex: container.getAttribute('tabindex'),
    ariaHidden: container.getAttribute('aria-hidden'),
    ariaModal: container.getAttribute('aria-modal'),
    ariaLabelledBy: container.getAttribute('aria-labelledby'),
    inert: container.inert,
  };

  // A hand-written container may be missing the two attributes that make it a
  // dialog you can move focus into. Adding them is the same kind of repair
  // copy-button.js makes for a missing accessible name.
  if (!container.getAttribute('role')) container.setAttribute('role', 'dialog');
  if (!container.hasAttribute('tabindex'))
    container.setAttribute('tabindex', '-1');

  // An unnamed dialog announces as just "dialog" (WCAG 4.1.2). The React
  // component names it from its title, and a hand-written drawer almost always
  // has the same title element — it just has no id to point at. Name it from
  // there rather than invent a string, which would be untranslated English in
  // a module that otherwise holds no copy. A title minted an id here is given
  // it back on destroy.
  let mintedTitleId = null;
  if (
    !container.getAttribute('aria-label') &&
    !container.getAttribute('aria-labelledby')
  ) {
    const title = container.querySelector(
      `.mg-drawer__title, .${FLOATING_PANEL_CLASS}__title`
    );
    if (title) {
      if (!title.id) {
        mintedTitleId = nextTitleId(doc);
        title.id = mintedTitleId;
      }
      container.setAttribute('aria-labelledby', title.id);
    }
  }

  const closeButton = container.querySelector(
    `.mg-drawer__close, .${FLOATING_PANEL_CLASS}__close`
  );

  const emit = (type, detail) => {
    container.dispatchEvent(
      new CustomEvent(type, { bubbles: true, detail: { ...detail, container } })
    );
  };

  const syncTriggers = () => {
    triggersFor(container).forEach(trigger => {
      trigger.setAttribute('aria-expanded', String(open));
      trigger.setAttribute('aria-controls', container.id);
    });
  };

  const removeBackdrop = () => {
    backdrop?.remove();
    backdrop = null;
  };

  const addBackdrop = () => {
    if (backdrop || !isModal(container)) return;
    backdrop = doc.createElement('div');
    backdrop.className = BACKDROP_CLASS;
    backdrop.setAttribute('aria-hidden', 'true');
    // Created by this module, so it is removed on close and on destroy; a
    // backdrop in the source markup is left alone.
    backdrop.setAttribute('data-mg-js-drawer-backdrop', '');
    backdrop.addEventListener('click', () => close(), { signal });
    container.before(backdrop);
  };

  // A closed drawer stays in the DOM but off-screen. `inert` keeps its
  // controls out of the tab order and away from assistive technology, which
  // `visibility: hidden` alone does not guarantee mid-transition.
  const applyState = () => {
    container.classList.toggle('is-open', open);
    container.inert = !open;
    if (open) {
      container.removeAttribute('aria-hidden');
      if (isModal(container)) container.setAttribute('aria-modal', 'true');
    } else {
      container.setAttribute('aria-hidden', 'true');
      container.removeAttribute('aria-modal');
    }
    syncTriggers();
  };

  function openDrawer() {
    if (destroyed || open) return;
    open = true;
    returnFocusTo = doc.activeElement;
    addBackdrop();
    applyState();
    (closeButton || container).focus();
    emit(OPENED_EVENT);
  }

  function close() {
    if (destroyed || !open) return;
    open = false;
    removeBackdrop();
    applyState();
    const target = returnFocusTo;
    returnFocusTo = null;
    // Only take focus back if it is still ours to move: a script that focused
    // something else while the drawer was open keeps it.
    const active = doc.activeElement;
    const focusWasInside =
      container.contains(active) || !active || active === doc.body;
    if (focusWasInside && target?.isConnected && target.focus) target.focus();
    emit(CLOSED_EVENT);
  }

  function toggle() {
    if (open) close();
    else openDrawer();
  }

  // Escape closes, matching the React component, which listens on the document
  // so a drawer closes even when focus has left it.
  doc.addEventListener(
    'keydown',
    event => {
      if (event.key === 'Escape' && open) close();
    },
    { signal }
  );

  // Keep Tab inside a modal drawer. A floating panel is non-modal: the rest of
  // the page is still operable, so trapping Tab there would be wrong.
  container.addEventListener(
    'keydown',
    event => {
      if (event.key !== 'Tab' || !open || !isModal(container)) return;
      const focusable = focusableIn(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    { signal }
  );

  closeButton?.addEventListener('click', () => close(), { signal });

  // One delegated listener, so triggers added to the page later still work.
  doc.addEventListener(
    'click',
    event => {
      const trigger = event.target.closest?.(TRIGGER_SELECTOR);
      if (
        !trigger ||
        trigger.getAttribute('data-mg-drawer-trigger') !== container.id
      ) {
        return;
      }
      event.preventDefault();
      toggle();
    },
    { signal }
  );

  container.addEventListener(OPEN_EVENT, () => openDrawer(), { signal });
  container.addEventListener(CLOSE_EVENT, () => close(), { signal });
  container.addEventListener(TOGGLE_EVENT, () => toggle(), { signal });

  if (open) addBackdrop();
  applyState();

  const handle = {
    open: openDrawer,
    close,
    toggle,
    isOpen: () => open,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      controller.abort();
      removeBackdrop();
      container.inert = initial.inert;
      const restore = (name, value) => {
        if (value === null) container.removeAttribute(name);
        else container.setAttribute(name, value);
      };
      restore('role', initial.role);
      restore('tabindex', initial.tabindex);
      restore('aria-hidden', initial.ariaHidden);
      restore('aria-modal', initial.ariaModal);
      restore('aria-labelledby', initial.ariaLabelledBy);
      if (mintedTitleId) {
        const title = doc.getElementById(mintedTitleId);
        if (title) title.removeAttribute('id');
        mintedTitleId = null;
      }
      triggersFor(container).forEach(trigger => {
        trigger.removeAttribute('aria-expanded');
        trigger.removeAttribute('aria-controls');
      });
      registry.instances.delete(container);
      container.removeAttribute(INITIALISED_ATTR);
    },
  };

  container.setAttribute(INITIALISED_ATTR, 'true');
  registry.instances.set(container, handle);
  return handle;
}

/**
 * Enhances every `[data-mg-js-drawer]` container in `scope`, including `scope`
 * itself. A container that is already enhanced is skipped, so calling this
 * again after adding markup is safe.
 *
 * @param {Document|Element|Iterable<Element>} [scope=document]
 * @returns {Array<object>} Handles for the drawers this call enhanced
 */
export function mgDrawer(scope = document) {
  return collect(scope, DRAWER_SELECTOR)
    .filter(container => !container.hasAttribute(INITIALISED_ATTR))
    .map(container => enhance(container));
}

/**
 * Destroys every enhanced drawer in `scope`, including `scope` itself:
 * removes listeners and any backdrop this module added, and restores the
 * attributes it set.
 *
 * @param {Document|Element|Iterable<Element>} [scope=document]
 */
export function mgDrawerDestroy(scope = document) {
  collect(scope, `[${INITIALISED_ATTR}]`).forEach(container => {
    registry.instances.get(container)?.destroy();
  });
}

/**
 * The handle for an enhanced drawer, or null.
 *
 * @param {Element} container
 * @returns {object|null}
 */
export function mgDrawerInstance(container) {
  return registry.instances.get(container) || null;
}

/** Opens one enhanced drawer. @param {Element} container */
export const mgDrawerOpen = container =>
  registry.instances.get(container)?.open();

/** Closes one enhanced drawer. @param {Element} container */
export const mgDrawerClose = container =>
  registry.instances.get(container)?.close();

/** Toggles one enhanced drawer. @param {Element} container */
export const mgDrawerToggle = container =>
  registry.instances.get(container)?.toggle();

function autoInit() {
  mgDrawer(
    collect(document, DRAWER_SELECTOR).filter(
      container => !container.hasAttribute(SKIP_ATTR)
    )
  );
}

// Expose for manual re-init after a route change, matching mgShowMore and
// mgPreviewAccess.
if (typeof window !== 'undefined') {
  window.mgDrawer = mgDrawer;
  window.mgDrawerDestroy = mgDrawerDestroy;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    autoInit();
  }
}
