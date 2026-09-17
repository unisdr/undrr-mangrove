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

export const SWITCH_PENDING_DEFAULT_LABELS = Object.freeze({
  saving: 'Saving…',
  stillSaving: 'Still saving…',
  error: 'Could not save the change. Try again.',
  on: label => (label ? `${label} turned on` : 'Turned on'),
  off: label => (label ? `${label} turned off` : 'Turned off'),
});

const instances = new WeakMap();

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

function labelText(input) {
  const label = input.labels?.[0] || input.closest('label');
  const text =
    label?.querySelector('.mg-switch__label')?.textContent ??
    label?.textContent ??
    input.getAttribute('aria-label') ??
    '';
  return text.replace(/\s+/g, ' ').trim();
}

function formatLabel(value, label, input) {
  if (typeof value === 'function') return String(value(label, input) ?? '');
  return String(value ?? '').replace(/\{label\}/g, label);
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

function noResponderError() {
  return new Error(
    'mg-switch: no mg-switch:save listener called respondWith(), so the change was reverted.'
  );
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
  const noop = { destroy() {} };
  if (!input || typeof input.addEventListener !== 'function') return noop;
  const existing = instances.get(input);
  if (existing) return existing;
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
  if (!status) {
    createdStatus = input.ownerDocument.createElement('span');
    createdStatus.className = 'mg-u-sr-only';
    createdStatus.setAttribute('role', 'status');
    createdStatus.setAttribute(CREATED_ATTR, '');
    const anchor = input.closest('label') || input;
    anchor.insertAdjacentElement('afterend', createdStatus);
    status = createdStatus;
  }

  let current = null;
  let lastNudge = -Infinity;
  let writeTimer = null;
  let destroyed = false;

  const write = text => {
    view.clearTimeout(writeTimer);
    writeTimer = null;
    if (status.textContent === text) {
      status.textContent = '';
      writeTimer = view.setTimeout(() => {
        writeTimer = null;
        status.textContent = text;
      }, REANNOUNCE_DELAY_MS);
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
    let open = true;
    let saveEvent = null;
    const detail = {
      checked,
      signal: requestSignal,
      respondWith(promise) {
        if (!open) {
          throw new Error(
            'mg-switch: respondWith() must be called while mg-switch:save is dispatched.'
          );
        }
        if (response) {
          throw new Error('mg-switch: respondWith() was already called.');
        }
        response = Promise.resolve(promise);
        saveEvent.preventDefault();
      },
    };
    saveEvent = new CustomEvent('mg-switch:save', {
      bubbles: true,
      cancelable: true,
      detail,
    });
    input.dispatchEvent(saveEvent);
    open = false;
    if (!response) {
      const error = noResponderError();
      console.warn(error.message, input);
      return Promise.reject(error);
    }
    return response;
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

  const onAbort = () => handle.destroy();

  const handle = {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      input.removeEventListener('click', onClick);
      input.removeEventListener('change', onChange);
      signal?.removeEventListener('abort', onAbort);
      view.clearTimeout(writeTimer);
      const request = current;
      current = null;
      if (request) {
        view.clearTimeout(request.timer);
        view.cancelAnimationFrame(request.frame);
        request.controller.abort();
        input.removeAttribute('aria-busy');
      }
      createdStatus?.remove();
      input.removeAttribute(ENHANCED_ATTR);
      instances.delete(input);
    },
  };

  input.addEventListener('click', onClick);
  input.addEventListener('change', onChange);
  signal?.addEventListener('abort', onAbort, { once: true });
  input.setAttribute(ENHANCED_ATTR, '');
  instances.set(input, handle);
  return handle;
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

/**
 * Enhances every `[data-mg-switch-pending]` input, or the switch input inside
 * a `[data-mg-switch-pending]` label, in `scope`. Already enhanced inputs are
 * skipped.
 *
 * @param {Document|Element|Iterable<Element>} [scope=document]
 * @param {Object} [options] Same as mgSwitchPending, except `status`
 * @returns {Array<{ destroy: () => void }>} Handles for the inputs this call enhanced
 */
export function mgSwitchPendingInit(scope = document, options = {}) {
  if (options.signal?.aborted) return [];
  // Each switch finds its own live region.
  const shared = { ...options };
  delete shared.status;
  const handles = [];
  collect(scope, SELECTOR).forEach(element => {
    const input = toInput(element);
    if (!input || instances.has(input)) return;
    handles.push(mgSwitchPending(input, shared));
  });
  return handles;
}

/**
 * Destroys every enhanced switch in `scope`, including `scope` itself.
 *
 * @param {Document|Element|Iterable<Element>} [scope=document]
 */
export function mgSwitchPendingDestroy(scope = document) {
  collect(scope, `[${ENHANCED_ATTR}]`).forEach(input => {
    instances.get(input)?.destroy();
  });
}

function autoInit() {
  const elements = collect(document, SELECTOR).filter(
    element => !element.hasAttribute(SKIP_ATTR)
  );
  mgSwitchPendingInit(elements);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    autoInit();
  }
}
