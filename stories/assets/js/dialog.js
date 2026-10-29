/** Native modal enhancement for authored disclosures. See Dialog.mdx. */
const KEY = Symbol.for('@undrr/mangrove/dialog');
const LOCK = Symbol.for('@undrr/mangrove/dialog-scroll');
const SELECTOR = '[data-mg-dialog]';

function elements(scope) {
  return [
    ...(scope.matches?.(SELECTOR) ? [scope] : []),
    ...scope.querySelectorAll(SELECTOR),
  ];
}

function lock(doc) {
  const root = doc.documentElement;
  const state = (doc[LOCK] ||= {
    count: 0,
    // A shorthand can serialize to an empty string when axes have different
    // priorities. Save the actual declarations, without touching other styles.
    properties: Array.from(root.style)
      .filter(name => ['overflow', 'overflow-x', 'overflow-y'].includes(name))
      .map(name => [
        name,
        root.style.getPropertyValue(name),
        root.style.getPropertyPriority(name),
      ]),
  });
  state.count += 1;
  root.style.setProperty('overflow', 'hidden', 'important');
  return () => {
    if (--state.count) return;
    for (const name of ['overflow', 'overflow-x', 'overflow-y'])
      root.style.removeProperty(name);
    for (const [name, value, priority] of state.properties)
      root.style.setProperty(name, value, priority);
    delete doc[LOCK];
  };
}

/** Enhance a document, element or Drupal behaviour scope. Idempotent. */
export function mgDialog(scope = document) {
  for (const root of elements(scope)) {
    // Nesting is unsupported: leave every involved disclosure readable rather
    // than moving a descendant root's content outside its language/context.
    if (
      root[KEY] ||
      root.parentElement?.closest(SELECTOR) ||
      root.querySelector(SELECTOR)
    )
      continue;
    const fallback = root.querySelector('[data-mg-dialog-fallback]');
    const summary = fallback?.querySelector(':scope > summary');
    const content = fallback?.querySelector('[data-mg-dialog-content]');
    const trigger = root.querySelector('[data-mg-dialog-trigger]');
    const closeButtons = [
      ...(content?.querySelectorAll('[data-mg-dialog-close]') || []),
    ];
    const close = closeButtons[0];
    const title = content?.querySelector('[data-mg-dialog-title]');
    const doc = root.ownerDocument;
    const dialog = doc.createElement('dialog');
    // Incomplete markup and unsupported browsers retain the disclosure.
    if (
      !summary ||
      !content ||
      !trigger ||
      !close ||
      !title ||
      !title.id ||
      typeof dialog.showModal !== 'function'
    )
      continue;
    dialog.className = 'mg-dialog';
    dialog.setAttribute('aria-labelledby', title.id);
    // A sticky header must leave useful space for reading. Normal flow is the
    // safe base when measurements cannot follow font/viewport/content changes.
    const header = title.closest('.mg-dialog__header');
    const ResizeObserver = doc.defaultView?.ResizeObserver;
    const updateHeader = () => {
      dialog.classList.toggle(
        'mg-dialog--sticky-header',
        Boolean(
          ResizeObserver &&
          dialog.open &&
          header &&
          header.getBoundingClientRect().height <= dialog.clientHeight / 2
        )
      );
    };
    const observer =
      header && ResizeObserver ? new ResizeObserver(updateHeader) : null;
    observer?.observe(dialog);
    if (header) observer?.observe(header);
    const placeholder = doc.createComment('mg-dialog content');
    content.before(placeholder);
    const original = [fallback.hidden, trigger.hidden];
    const originalClose = closeButtons.map(button => button.hidden);
    dialog.append(content);
    root.append(dialog);
    fallback.hidden = true;
    trigger.hidden = false;
    for (const button of closeButtons) button.hidden = false;
    const oldPopup = trigger.getAttribute('aria-haspopup');
    trigger.setAttribute('aria-haspopup', 'dialog');
    let release;
    let opener;
    let pointerOutside = false;
    const finish = event => {
      if (event && dialog.open) return;
      if (!release) return;
      release();
      release = undefined;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
    const open = () => {
      // Native close events are queued: settle a prior close before reopening.
      if (dialog.open) return;
      finish();
      // Pointer activation does not focus buttons in every browser (Safari).
      opener = trigger;
      try {
        dialog.showModal();
      } catch {
        // A disconnected/inactive document must not strand the content.
        root[KEY]();
        fallback.open = true;
        return;
      }
      release = lock(doc);
      dialog.scrollTop = 0;
      updateHeader();
      const initial = dialog.querySelector('[data-mg-dialog-initial-focus]');
      (initial || close).focus({ preventScroll: true });
    };
    const dismiss = () => {
      if (dialog.open) dialog.close();
      finish();
    };
    const outside = event => {
      const rect = dialog.getBoundingClientRect();
      return (
        event.target === dialog &&
        (event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom)
      );
    };
    const pointerdown = event => {
      pointerOutside = outside(event);
    };
    const click = event => {
      if (pointerOutside && outside(event)) dismiss();
      pointerOutside = false;
    };
    trigger.addEventListener('click', open);
    for (const button of closeButtons)
      button.addEventListener('click', dismiss);
    dialog.addEventListener('close', finish);
    dialog.addEventListener('pointerdown', pointerdown);
    dialog.addEventListener('click', click);
    root[KEY] = () => {
      const restoreFocus =
        dialog.contains(doc.activeElement) || doc.activeElement === trigger;
      observer?.disconnect();
      dismiss();
      trigger.removeEventListener('click', open);
      for (const button of closeButtons)
        button.removeEventListener('click', dismiss);
      dialog.removeEventListener('close', finish);
      dialog.removeEventListener('pointerdown', pointerdown);
      dialog.removeEventListener('click', click);
      placeholder.replaceWith(content);
      dialog.remove();
      [fallback.hidden, trigger.hidden] = original;
      closeButtons.forEach((button, index) => {
        button.hidden = originalClose[index];
      });
      if (oldPopup === null) trigger.removeAttribute('aria-haspopup');
      else trigger.setAttribute('aria-haspopup', oldPopup);
      delete root[KEY];
      // The enhanced opener is hidden again. Keep keyboard position in the
      // restored disclosure instead of leaving focus on that hidden button.
      if (
        restoreFocus &&
        root.isConnected &&
        !fallback.hidden &&
        trigger.hidden
      )
        summary.focus({ preventScroll: true });
    };
  }
}

/** Restore authored markup before replacing a component or behaviour scope. */
export function mgDialogDestroy(scope = document) {
  for (const root of elements(scope)) root[KEY]?.();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mgDialog(), {
      once: true,
    });
  } else mgDialog();
}
