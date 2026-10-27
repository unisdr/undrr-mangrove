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
const HYDRATION_ATTR = 'data-mg-drawer';
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

// Everything that can hold focus. Wider than a `[tabindex]`-and-form-controls
// list on purpose: an iframe, a contenteditable region or a `<summary>` inside
// an open drawer is reachable by Tab, and a trap that cannot see them either
// strands them outside the ring (unreachable) or lets Tab walk straight past
// the end of the drawer. Both were reproduced before this list was widened.
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]',
  '[tabindex]',
].join(', ');

// Tag names the browser puts in the tab order without a tabindex attribute.
const NATIVELY_TABBABLE = new Set([
  'A',
  'AREA',
  'BUTTON',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'AUDIO',
  'VIDEO',
  'SUMMARY',
]);

// Shared by every copy of this module on the page — a CDN build alongside a
// bundled one, or two versions — so one drawer is never enhanced twice and
// either copy can destroy an instance the other created. The per-element
// dataset flag is what survives that split; a module-scope WeakMap alone would
// not (docs/HYDRATION-AUTHORING.md).
//
// Deliberately unversioned. `INITIALISED_ATTR` is the marker that decides
// whether a container is already enhanced and it carries no version either, so
// a versioned registry key would let a v2 copy skip a v1 container as
// "initialised" and then fail to find its handle — leaving the container
// marked, its listeners live and nothing able to destroy it. The handle shape
// (`open` / `close` / `toggle` / `isOpen` / `destroy`) is the compatibility
// contract between copies, and it must stay additive.
const REGISTRY_KEY = Symbol.for('@undrr/mangrove/drawer');
const registry =
  globalThis[REGISTRY_KEY] ||
  (globalThis[REGISTRY_KEY] = { instances: new WeakMap(), openStack: [] });
// A copy that predates `openStack` may have created the registry first.
if (!registry.openStack) registry.openStack = [];

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

/**
 * Whether the element is hidden from rendering, and so out of the tab order.
 *
 * Walks ancestors rather than reading a layout box: `getClientRects()` is
 * empty in every non-rendering environment, which would make the trap think an
 * open drawer had nothing in it at all under test. Computed style answers the
 * same question in both.
 *
 * @param {Element} element
 * @returns {boolean}
 */
function isHidden(element) {
  const view = element.ownerDocument?.defaultView;
  if (!view?.getComputedStyle) return false;
  for (let node = element; node?.nodeType === 1; node = node.parentElement) {
    if (node.hasAttribute('hidden') || node.inert) return true;
    const style = view.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse'
    ) {
      return true;
    }
    // A closed <details> does not render anything but its <summary>.
    const parent = node.parentElement;
    if (
      parent?.tagName === 'DETAILS' &&
      !parent.open &&
      node.tagName !== 'SUMMARY'
    ) {
      return true;
    }
  }
  return false;
}

/**
 * The element's effective tabindex.
 *
 * Read from the attribute, then the tag, rather than from `element.tabIndex`:
 * the property's default for elements like `<iframe>` and `<summary>` is not
 * consistent across engines, and the trap has to agree with the browser about
 * what Tab will do.
 *
 * @param {Element} element
 * @returns {number}
 */
function tabIndexOf(element) {
  const attribute = element.getAttribute('tabindex');
  if (attribute !== null) {
    const value = Number(attribute);
    return Number.isNaN(value) ? -1 : value;
  }
  const editable = element.getAttribute('contenteditable');
  if (editable !== null && editable !== 'false') return 0;
  if (element.tagName === 'SUMMARY') {
    return element.parentElement?.tagName === 'DETAILS' ? 0 : -1;
  }
  return NATIVELY_TABBABLE.has(element.tagName) ? 0 : -1;
}

/**
 * Drops every radio in a group except the one the browser will actually stop
 * on: the checked one, or the first when none is checked. Keeping all three
 * made the last radio in a group the trap's `last`, which Tab never reaches —
 * so Tab walked out of the drawer instead of wrapping.
 *
 * @param {Element[]} elements
 * @returns {Element[]}
 */
function collapseRadioGroups(elements) {
  const isRadio = element =>
    element.tagName === 'INPUT' && element.type === 'radio' && element.name;
  const stops = new Map();
  elements.forEach(element => {
    if (!isRadio(element)) return;
    // The first radio is the stop until a checked one is found.
    if (!stops.has(element.name) || element.checked) {
      stops.set(element.name, element);
    }
  });
  return elements.filter(
    element => !isRadio(element) || stops.get(element.name) === element
  );
}

/**
 * Everything inside the container that Tab will actually stop on, in tab
 * order.
 *
 * @param {Element} container
 * @returns {Element[]}
 */
function tabbablesIn(container) {
  const matches = Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    element =>
      !element.disabled &&
      !element.closest('[inert]') &&
      tabIndexOf(element) >= 0 &&
      !isHidden(element)
  );
  return collapseRadioGroups(matches);
}

/**
 * Moves focus to the first of `candidates` that will actually take it, and
 * reports whether any did.
 *
 * `element.focus()` is a silent no-op on something unrendered, so a single
 * call cannot be trusted: an opener that was removed, hidden or never existed
 * used to leave focus on a control inside the drawer that had just been made
 * `inert` and `aria-hidden` — invisible, unannounced and worse than `<body>`.
 *
 * @param {Element[]} candidates
 * @param {Document} doc
 * @returns {boolean}
 */
function focusFirstAvailable(candidates, doc) {
  for (const element of candidates) {
    if (!element?.isConnected || typeof element.focus !== 'function') continue;
    if (isHidden(element)) continue;
    element.focus();
    if (doc.activeElement === element) return true;
  }
  // Nothing is left to go back to. Park focus on the document body so the next
  // Tab starts from the top of the page and a screen reader resumes there,
  // rather than leaving it inside a drawer that is now closed. The tabindex is
  // temporary so the body does not become a permanent tab stop.
  const body = doc.body;
  if (!body) return false;
  const hadTabIndex = body.hasAttribute('tabindex');
  if (!hadTabIndex) body.setAttribute('tabindex', '-1');
  body.focus();
  if (!hadTabIndex) body.removeAttribute('tabindex');
  return false;
}

/**
 * Puts one attribute back to the value it had before this module ran.
 *
 * @param {Element} element
 * @param {string} name
 * @param {string|null} value
 */
function restoreOn(element, name, value) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
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
    isOpen: container.classList.contains('is-open'),
    // Per trigger, because a hand-written page may already have wired
    // aria-expanded / aria-controls itself. Removing them unconditionally on
    // destroy took markup away that this module never added.
    triggers: triggersFor(container).map(trigger => ({
      trigger,
      ariaExpanded: trigger.getAttribute('aria-expanded'),
      ariaControls: trigger.getAttribute('aria-controls'),
    })),
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

  // Which drawers are open, innermost last. Shared through the registry so a
  // second copy of the module sees the same stack: only the topmost drawer
  // answers Escape, and only the topmost modal traps Tab.
  const pushOpen = () => {
    const index = registry.openStack.indexOf(container);
    if (index !== -1) registry.openStack.splice(index, 1);
    registry.openStack.push(container);
  };
  const popOpen = () => {
    const index = registry.openStack.indexOf(container);
    if (index !== -1) registry.openStack.splice(index, 1);
  };
  const isTopmost = () =>
    registry.openStack[registry.openStack.length - 1] === container;

  function openDrawer() {
    if (destroyed || open) return;
    open = true;
    returnFocusTo = doc.activeElement;
    pushOpen();
    addBackdrop();
    applyState();
    (closeButton || container).focus();
    emit(OPENED_EVENT);
  }

  function close() {
    if (destroyed || !open) return;
    // Read where focus is before applyState() makes the container inert, which
    // in a browser blurs whatever was inside it to <body> and would otherwise
    // make this look like focus had always been outside.
    const active = doc.activeElement;
    // Only take focus back if it is still ours to move: a script that focused
    // something else while the drawer was open keeps it.
    const focusWasInside =
      container.contains(active) || !active || active === doc.body;
    open = false;
    popOpen();
    removeBackdrop();
    applyState();
    const target = returnFocusTo;
    returnFocusTo = null;
    if (focusWasInside) {
      // The opener first; then any trigger still on the page, which is where a
      // keyboard user expects to land; then the body as the last resort.
      focusFirstAvailable([target, ...triggersFor(container)], doc);
    }
    emit(CLOSED_EVENT);
  }

  function toggle() {
    if (open) close();
    else openDrawer();
  }

  /** Whether an event came from inside this drawer or from one of its triggers. */
  const isOurs = target =>
    container.contains(target) || triggersFor(container).includes(target);

  // Escape closes, matching the React component, which listens on the document
  // so a modal drawer closes even when focus has left it.
  doc.addEventListener(
    'keydown',
    event => {
      if (event.key !== 'Escape' || !open || destroyed) return;
      // Something nearer the user already answered this Escape.
      if (event.defaultPrevented) return;
      // A nested <dialog>, and anything else that opens its own layer inside
      // the drawer, owns Escape first. Without this, one Escape dismissed both
      // the nested dialog and the drawer behind it.
      if (event.target?.closest?.('dialog[open]')) return;
      // Escape peels one layer: only the innermost open drawer answers.
      // Otherwise a drawer opened from inside another closed both at once.
      if (!isTopmost()) return;
      // A non-modal floating panel leaves the rest of the page operable, so
      // Escape there belongs to whatever the user is actually in — typing
      // Escape in a page search field should not dismiss the map's layer
      // panel. A modal drawer owns the page, so it answers from anywhere.
      if (!isModal(container) && !isOurs(event.target)) return;
      close();
    },
    { signal }
  );

  // Keep Tab inside a modal drawer. A floating panel is non-modal: the rest of
  // the page is still operable, so trapping Tab there would be wrong.
  //
  // Listening on the document rather than the container is what makes this a
  // trap rather than a suggestion. A container listener only ever sees Tab
  // while focus is already inside, so once focus had left — through an iframe,
  // or a script moving it — nothing could pull it back.
  doc.addEventListener(
    'keydown',
    event => {
      if (event.key !== 'Tab' || !open || destroyed) return;
      if (!isModal(container) || !isTopmost()) return;
      const tabbables = tabbablesIn(container);
      if (tabbables.length === 0) {
        // Nothing to move to. Hold focus on the dialog itself so Tab cannot
        // walk out into the page behind the backdrop.
        event.preventDefault();
        if (doc.activeElement !== container) container.focus();
        return;
      }
      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      const active = doc.activeElement;
      // Focus is outside the drawer: pull it back to whichever end the user is
      // heading for.
      if (!container.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      // The container itself holds focus (it is `tabindex="-1"`, and open()
      // focuses it when there is no close button). Tab forward from there
      // reaches `first` on its own, but Shift+Tab would leave the drawer.
      if (active === container) {
        if (event.shiftKey) {
          event.preventDefault();
          last.focus();
        }
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
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

  // Scoped to this container. A command event dispatched on a drawer nested
  // inside another one bubbles, and without this the outer drawer answered it
  // too and opened itself.
  const onCommand = run => event => {
    if (event.target !== container) return;
    run();
  };
  container.addEventListener(OPEN_EVENT, onCommand(openDrawer), { signal });
  container.addEventListener(CLOSE_EVENT, onCommand(close), { signal });
  container.addEventListener(TOGGLE_EVENT, onCommand(toggle), { signal });

  if (open) {
    pushOpen();
    addBackdrop();
  }
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
      popOpen();
      removeBackdrop();
      if (initial.inert === undefined) delete container.inert;
      else container.inert = initial.inert;
      // Put the open/closed class back where the markup had it. Destroying an
      // open drawer used to leave `is-open` behind, so the page was left
      // showing a drawer nothing could close.
      container.classList.toggle('is-open', initial.isOpen);
      const restore = (name, value) => restoreOn(container, name, value);
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
      // Restore each trigger to what the markup had, rather than stripping
      // both attributes: a page that wired its own aria-expanded /
      // aria-controls got them deleted by a destroy that never added them.
      const known = new Map(
        initial.triggers.map(entry => [entry.trigger, entry])
      );
      triggersFor(container).forEach(trigger => {
        const entry = known.get(trigger);
        restoreOn(trigger, 'aria-expanded', entry ? entry.ariaExpanded : null);
        restoreOn(trigger, 'aria-controls', entry ? entry.ariaControls : null);
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
    .filter(container => {
      // The two markers are separate so that a container is driven by one
      // lifecycle and never both. Nothing stopped a page putting both on the
      // same element, though, and then React would re-render away the markup
      // this module had just bound listeners to. Refuse, and say which one
      // to remove.
      if (!container.hasAttribute(HYDRATION_ATTR)) return true;
      console.warn(
        `[mg-drawer] #${container.id || '(no id)'} carries both ${HYDRATION_ATTR} and ${DRAWER_SELECTOR.slice(1, -1)}. ` +
          'It is left to the hydration lifecycle; remove one marker to choose.',
        container
      );
      return false;
    })
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
    const handle = registry.instances.get(container);
    if (handle) {
      handle.destroy();
      return;
    }
    // Marked as enhanced, but no handle in the shared registry. That means a
    // copy of this module keyed its registry differently, so its listeners
    // cannot be removed from here. Say so rather than silently doing nothing
    // and reporting success.
    console.warn(
      `[mg-drawer] #${container.id || '(no id)'} is marked ${INITIALISED_ATTR} but has no handle in the shared registry, ` +
        'so it cannot be destroyed from this copy of the module.',
      container
    );
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
