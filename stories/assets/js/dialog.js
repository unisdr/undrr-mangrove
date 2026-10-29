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
    value: root.style.getPropertyValue('overflow'),
    priority: root.style.getPropertyPriority('overflow'),
  });
  state.count += 1;
  root.style.setProperty('overflow', 'hidden');
  return () => {
    if (--state.count) return;
    if (state.value)
      root.style.setProperty('overflow', state.value, state.priority);
    else root.style.removeProperty('overflow');
    delete doc[LOCK];
  };
}

/** Enhance a document, element or Drupal behaviour scope. Idempotent. */
export function mgDialog(scope = document) {
  for (const root of elements(scope)) {
    if (root[KEY]) continue;
    const fallback = root.querySelector('[data-mg-dialog-fallback]');
    const content = fallback?.querySelector('[data-mg-dialog-content]');
    const trigger = root.querySelector('[data-mg-dialog-trigger]');
    const close = content?.querySelector('[data-mg-dialog-close]');
    const title = content?.querySelector('[data-mg-dialog-title]');
    const doc = root.ownerDocument;
    const dialog = doc.createElement('dialog');
    // Incomplete markup and unsupported browsers retain the disclosure.
    if (
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
    const placeholder = doc.createComment('mg-dialog content');
    content.before(placeholder);
    const original = [fallback.hidden, trigger.hidden, close.hidden];
    dialog.append(content);
    root.append(dialog);
    fallback.hidden = true;
    trigger.hidden = false;
    close.hidden = false;
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
    close.addEventListener('click', dismiss);
    dialog.addEventListener('close', finish);
    dialog.addEventListener('pointerdown', pointerdown);
    dialog.addEventListener('click', click);
    root[KEY] = () => {
      dismiss();
      trigger.removeEventListener('click', open);
      close.removeEventListener('click', dismiss);
      dialog.removeEventListener('close', finish);
      dialog.removeEventListener('pointerdown', pointerdown);
      dialog.removeEventListener('click', click);
      placeholder.replaceWith(content);
      dialog.remove();
      [fallback.hidden, trigger.hidden, close.hidden] = original;
      if (oldPopup === null) trigger.removeAttribute('aria-haspopup');
      else trigger.setAttribute('aria-haspopup', oldPopup);
      delete root[KEY];
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
