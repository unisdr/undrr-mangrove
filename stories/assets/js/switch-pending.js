// Pending state for .mg-switch: announces progress, ignores presses while a
// save runs, times out, and reverts on failure. See Checkbox.mdx.

/** A request that has not settled by then is aborted and reverts. */
export const PENDING_TIMEOUT_MS = 10000;

/** "Still saving" is announced at most this often. */
export const STILL_SAVING_INTERVAL_MS = 3000;

// Clearing the region and writing the same text after this delay makes
// screen readers announce the repeated message again.
const REANNOUNCE_DELAY_MS = 100;

const SELECTOR = '[data-mg-switch-pending]';
const INPUT_SELECTOR = '.mg-switch__input';
const ENHANCED_ATTR = 'data-mg-switch-pending-enhanced';
const SKIP_ATTR = 'data-mg-switch-pending-skip-auto-init';
const CREATED_ATTR = 'data-mg-switch-status-created';
const LIVE_SELECTOR = '[role="status"], [role="alert"], [aria-live]';

export const SWITCH_PENDING_DEFAULT_LABELS = Object.freeze({
  saving: 'Saving…',
  stillSaving: 'Still saving…',
  error: 'Could not save the change. Try again.',
  on: label => (label ? `${label} turned on` : 'Turned on'),
  off: label => (label ? `${label} turned off` : 'Turned off'),
});

// Shared by every copy of this module on the page (a CDN copy and a bundled
// one, or two versions), so a switch is never enhanced twice and copies that
// share a live region do not overwrite each other's delayed writes.
const REGISTRY_KEY = Symbol.for('@undrr/mangrove/switch-pending@1');
const registry =
  globalThis[REGISTRY_KEY] ||
  (globalThis[REGISTRY_KEY] = {
    // input -> { handle, auto }
    instances: new WeakMap(),
    // live region -> { timer, owner, view } for a pending re-announcement
    writes: new WeakMap(),
  });

function readLabels(element) {
  const raw = element?.getAttribute('data-mg-switch-labels');
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const clean = text =>
  String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();

// Text of an element without any live regions inside it, so a status region
// placed in the label is not read back as part of the label.
function textWithoutLiveRegions(element) {
  if (!element) return '';
  if (!element.querySelector(LIVE_SELECTOR)) return element.textContent;
  const copy = element.cloneNode(true);
  copy.querySelectorAll(LIVE_SELECTOR).forEach(region => region.remove());
  return copy.textContent;
}

// Follows accessible name order: aria-labelledby, aria-label, then the label.
function labelText(input) {
  const doc = input.ownerDocument;
  const labelledBy = clean(
    (input.getAttribute('aria-labelledby') || '')
      .split(/\s+/)
      .filter(Boolean)
      .map(id => textWithoutLiveRegions(doc.getElementById(id)))
      .join(' ')
  );
  if (labelledBy) return labelledBy;
  const ariaLabel = clean(input.getAttribute('aria-label'));
  if (ariaLabel) return ariaLabel;
  const label = input.labels?.[0] || input.closest('label');
  return (
    clean(textWithoutLiveRegions(label?.querySelector('.mg-switch__label'))) ||
    clean(textWithoutLiveRegions(label))
  );
}

function formatLabel(value, label, input) {
  if (typeof value === 'function') return clean(value(label, input));
  return clean(String(value ?? '').replace(/\{label\}/g, label));
}

function resolveStatus(input, option) {
  const doc = input.ownerDocument;
  if (option) {
    const element =
      typeof option === 'string' ? doc.querySelector(option) : option;
    if (element) return element;
  }
  const byData = input.getAttribute('data-mg-switch-status');
  if (byData) {
    const element = doc.getElementById(byData);
    if (element) return element;
  }
  const described = (input.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter(Boolean)
    .map(id => doc.getElementById(id))
    .find(
      element =>
        element &&
        (element.getAttribute('role') === 'status' ||
          element.hasAttribute('aria-live'))
    );
  return described || null;
}

function toInput(element) {
  if (!element) return null;
  if (element.matches(INPUT_SELECTOR)) return element;
  return element.querySelector(INPUT_SELECTOR);
}

function cancelWrite(status, owner) {
  const pending = registry.writes.get(status);
  if (!pending || (owner && pending.owner !== owner)) return;
  pending.view.clearTimeout(pending.timer);
  registry.writes.delete(status);
}

// Built outside mgSwitchPending, so the listener a long-lived signal holds
// references the helper only weakly: a switch removed without destroy() can
// still be garbage collected.
function destroyOnAbort(handle) {
  const ref =
    typeof WeakRef === 'function'
      ? new WeakRef(handle)
      : { deref: () => handle };
  return () => ref.deref()?.destroy();
}

function noResponderError() {
  return new Error(
    'mg-switch: no mg-switch:save listener called respondWith() or preventDefault(), so the change was reverted.'
  );
}

function enhance(input, options, auto) {
  const noop = { destroy() {} };
  if (!input || typeof input.addEventListener !== 'function') return noop;
  const existing = registry.instances.get(input);
  if (existing) {
    // An explicit call takes over a switch that page-load auto-init enhanced,
    // so its options are not silently ignored.
    if (!existing.auto || auto) return existing.handle;
    existing.handle.destroy();
  }
  const { signal } = options;
  if (signal?.aborted) return noop;

  const view = input.ownerDocument.defaultView || window;
  const timeout =
    Number.isFinite(options.timeout) && options.timeout > 0
      ? options.timeout
      : PENDING_TIMEOUT_MS;
  const labels = {
    ...SWITCH_PENDING_DEFAULT_LABELS,
    ...readLabels(input.closest('label')),
    ...readLabels(input),
    ...(options.labels || {}),
  };

  let status = resolveStatus(input, options.status);
  let createdStatus = null;
  // After the label, never inside it, so announcements are not part of the
  // switch's accessible name.
  const placeCreatedStatus = () => {
    const anchor = input.closest('label') || input;
    if (anchor.nextElementSibling !== createdStatus) {
      anchor.insertAdjacentElement('afterend', createdStatus);
    }
  };
  if (!status) {
    createdStatus = input.ownerDocument.createElement('span');
    createdStatus.className = 'mg-u-sr-only';
    createdStatus.setAttribute('role', 'status');
    createdStatus.setAttribute(CREATED_ATTR, '');
    placeCreatedStatus();
    status = createdStatus;
  } else if (Array.from(input.labels || []).some(l => l.contains(status))) {
    console.warn(
      'mg-switch: the status region is inside the switch label, so announcements become part of its name. Place it after the label.',
      input
    );
  }

  let current = null;
  let lastNudge = -Infinity;
  let destroyed = false;
  const owner = {};

  const write = text => {
    // A removed switch cannot be used, so say nothing about it, and do not
    // leave the region this helper created behind on the page.
    if (!input.isConnected) {
      cancelWrite(status, owner);
      if (createdStatus) {
        createdStatus.remove();
        createdStatus.textContent = '';
      }
      return;
    }
    if (createdStatus) placeCreatedStatus();
    cancelWrite(status);
    if (status.textContent === text) {
      status.textContent = '';
      registry.writes.set(status, {
        owner,
        view,
        timer: view.setTimeout(() => {
          registry.writes.delete(status);
          status.textContent = text;
        }, REANNOUNCE_DELAY_MS),
      });
      return;
    }
    status.textContent = text;
  };

  const emit = (type, detail) =>
    input.dispatchEvent(
      new CustomEvent(type, { bubbles: true, cancelable: false, detail })
    );

  const stillSaving = () => {
    const now = Date.now();
    if (now - lastNudge < STILL_SAVING_INTERVAL_MS) return;
    lastNudge = now;
    write(formatLabel(labels.stillSaving, labelText(input), input));
  };

  const onClick = event => {
    if (!current) return;
    // Cancelling the click keeps checked where it is.
    event.preventDefault();
    stillSaving();
  };

  const requestSave = (checked, requestSignal) => {
    if (typeof options.save === 'function') {
      return options.save(checked, requestSignal);
    }
    let response = null;
    let dispatching = true;
    let answer = null;
    let saveEvent = null;
    const detail = {
      checked,
      signal: requestSignal,
      respondWith(promise) {
        if (response) {
          throw new Error('mg-switch: respondWith() was already called.');
        }
        if (!dispatching && !answer) {
          throw new Error(
            'mg-switch: respondWith() was called after mg-switch:save was dispatched. Call it synchronously, or call event.preventDefault() synchronously first and respondWith() later.'
          );
        }
        response = Promise.resolve(promise);
        if (dispatching) saveEvent.preventDefault();
        else answer(response);
      },
    };
    saveEvent = new CustomEvent('mg-switch:save', {
      bubbles: true,
      cancelable: true,
      detail,
    });
    input.dispatchEvent(saveEvent);
    dispatching = false;
    if (response) return response;
    if (saveEvent.defaultPrevented) {
      // Claimed: respondWith() may follow after an await. The timeout covers
      // a listener that never calls it.
      return new Promise(resolve => {
        answer = resolve;
      });
    }
    const error = noResponderError();
    console.warn(error.message, input);
    return Promise.reject(error);
  };

  const onChange = () => {
    if (current) {
      // A script changed the switch mid-request: undo it.
      input.checked = !input.checked;
      stillSaving();
      return;
    }

    const requested = input.checked;
    const request = { controller: new AbortController() };
    current = request;
    write(formatLabel(labels.saving, labelText(input), input));
    // Mark busy a frame later, so the new state is announced first.
    request.frame = view.requestAnimationFrame(() => {
      if (current === request) input.setAttribute('aria-busy', 'true');
    });

    const settle = (ok, reason, error) => {
      // Stale: this request already timed out, or the helper was destroyed.
      if (current !== request) return;
      current = null;
      view.clearTimeout(request.timer);
      view.cancelAnimationFrame(request.frame);
      input.setAttribute('aria-busy', 'false');
      const label = labelText(input);
      if (ok) {
        // A form reset or a script may have moved it without a change event.
        input.checked = requested;
        write(formatLabel(requested ? labels.on : labels.off, label, input));
        emit('mg-switch:settled', { checked: requested, ok: true });
        return;
      }
      request.controller.abort(error);
      input.checked = !requested;
      write(formatLabel(labels.error, label, input));
      emit('mg-switch:failed', {
        checked: !requested,
        requested,
        reason,
        error,
      });
    };

    request.timer = view.setTimeout(() => {
      const error = new DOMException(
        `Saving the switch took longer than ${timeout}ms.`,
        'TimeoutError'
      );
      settle(false, 'timeout', error);
    }, timeout);

    emit('mg-switch:pending', { checked: requested });
    // A pending listener may have destroyed the helper.
    if (current !== request) return;

    let result;
    try {
      result = requestSave(requested, request.controller.signal);
    } catch (error) {
      result = Promise.reject(error);
    }
    Promise.resolve(result).then(
      () => settle(true),
      error => settle(false, 'error', error)
    );
  };

  const handle = {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      input.removeEventListener('click', onClick);
      input.removeEventListener('change', onChange);
      signal?.removeEventListener('abort', onAbort);
      cancelWrite(status, owner);
      const request = current;
      current = null;
      if (request) {
        view.clearTimeout(request.timer);
        view.cancelAnimationFrame(request.frame);
        request.controller.abort();
        input.removeAttribute('aria-busy');
      }
      createdStatus?.remove();
      if (registry.instances.get(input)?.handle === handle) {
        registry.instances.delete(input);
        input.removeAttribute(ENHANCED_ATTR);
      }
    },
  };
  const onAbort = destroyOnAbort(handle);

  input.addEventListener('click', onClick);
  input.addEventListener('change', onChange);
  signal?.addEventListener('abort', onAbort, { once: true });
  input.setAttribute(ENHANCED_ATTR, '');
  registry.instances.set(input, { handle, auto });
  return handle;
}

/**
 * Adds the pending state to one `.mg-switch__input`.
 *
 * @param {HTMLInputElement} input
 * @param {Object} [options]
 * @param {(checked: boolean, signal: AbortSignal) => Promise<unknown>} [options.save]
 *   Saves the new position; resolving means success. Without it, a cancelable
 *   `mg-switch:save` event is dispatched for a listener to answer.
 * @param {Element|string} [options.status] Live region, or a selector for one
 * @param {number} [options.timeout=10000] Milliseconds before a save fails
 * @param {Object} [options.labels] `{ saving, stillSaving, error, on, off }`
 * @param {AbortSignal} [options.signal] Aborting it destroys the helper
 * @returns {{ destroy: () => void }}
 */
export function mgSwitchPending(input, options = {}) {
  return enhance(input, options || {}, false);
}

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

function initAll(elements, options, auto) {
  if (options.signal?.aborted) return [];
  // Each switch finds its own live region.
  const shared = { ...options };
  delete shared.status;
  const handles = [];
  elements.forEach(element => {
    const input = toInput(element);
    if (!input) return;
    const existing = registry.instances.get(input);
    if (existing && (!existing.auto || auto)) return;
    handles.push(enhance(input, shared, auto));
  });
  return handles;
}

/**
 * Enhances every `[data-mg-switch-pending]` input, or the switch input inside
 * a `[data-mg-switch-pending]` label, in `scope`. Inputs enhanced by an
 * explicit call are skipped; inputs enhanced only by page-load auto-init are
 * taken over with these options.
 *
 * @param {Document|Element|Iterable<Element>} [scope=document]
 * @param {Object} [options] Same as mgSwitchPending, except `status`
 * @returns {Array<{ destroy: () => void }>} Handles for the inputs this call enhanced
 */
export function mgSwitchPendingInit(scope = document, options = {}) {
  return initAll(collect(scope, SELECTOR), options || {}, false);
}

/**
 * Destroys every enhanced switch in `scope`, including `scope` itself.
 *
 * @param {Document|Element|Iterable<Element>} [scope=document]
 */
export function mgSwitchPendingDestroy(scope = document) {
  collect(scope, `[${ENHANCED_ATTR}]`).forEach(input => {
    registry.instances.get(input)?.handle.destroy();
  });
}

function autoInit() {
  const elements = collect(document, SELECTOR).filter(
    element => !element.hasAttribute(SKIP_ATTR)
  );
  initAll(elements, {}, true);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    autoInit();
  }
}
