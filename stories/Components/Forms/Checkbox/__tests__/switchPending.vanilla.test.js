import { fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import {
  mgSwitchPending,
  mgSwitchPendingDestroy,
  mgSwitchPendingInit,
  PENDING_TIMEOUT_MS,
  STILL_SAVING_INTERVAL_MS,
} from '../../../../assets/js/switch-pending';

const switchMarkup = ({
  id = 'alerts',
  label = 'Real-time alerts',
  inputAttrs = '',
  labelAttrs = '',
  after = '',
} = {}) => `
  <label class="mg-switch" ${labelAttrs}>
    <input type="checkbox" role="switch" class="mg-switch__input" id="${id}" ${inputAttrs} />
    <span class="mg-switch__track" aria-hidden="true">
      <span class="mg-switch__thumb"></span>
    </span>
    <span class="mg-switch__label">${label}</span>
  </label>${after}`;

const mount = options => {
  document.body.innerHTML = switchMarkup(options);
  return document.querySelector('.mg-switch__input');
};

/** A save whose requests the test settles by hand. */
const controlledSave = () => {
  const requests = [];
  const save = jest.fn(
    (checked, signal) =>
      new Promise((resolve, reject) => {
        requests.push({ checked, signal, resolve, reject });
      })
  );
  return { save, requests };
};

const advance = ms => jest.advanceTimersByTime(ms);
const nextFrame = () => advance(20);
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const statusOf = input =>
  input.closest('label').nextElementSibling?.matches('[role="status"]')
    ? input.closest('label').nextElementSibling
    : null;

/** Counts listeners an element holds, from spies on add and remove. */
const trackListeners = target => {
  const add = jest.spyOn(target, 'addEventListener');
  const remove = jest.spyOn(target, 'removeEventListener');
  return () => add.mock.calls.length - remove.mock.calls.length;
};

describe('mgSwitchPending', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    mgSwitchPendingDestroy(document);
    document.body.innerHTML = '';
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('moves at once, announces saving, and sets aria-busy a frame later', () => {
    const input = mount();
    const { save } = controlledSave();
    mgSwitchPending(input, { save });
    const status = statusOf(input);

    fireEvent.click(input);
    expect(input.checked).toBe(true);
    expect(status).toHaveTextContent('Saving…');
    expect(input).not.toHaveAttribute('aria-busy');
    expect(save).toHaveBeenCalledWith(true, expect.any(AbortSignal));

    nextFrame();
    expect(input).toHaveAttribute('aria-busy', 'true');
    expect(input).toBeEnabled();
  });

  it('announces the outcome and clears busy on success', async () => {
    const input = mount();
    const { save, requests } = controlledSave();
    mgSwitchPending(input, { save });
    const status = statusOf(input);

    fireEvent.click(input);
    nextFrame();
    requests[0].resolve();
    await flush();

    expect(input.checked).toBe(true);
    expect(input).toHaveAttribute('aria-busy', 'false');
    expect(status).toHaveTextContent('Real-time alerts turned on');

    fireEvent.click(input);
    requests[1].resolve();
    await flush();
    expect(input.checked).toBe(false);
    expect(status).toHaveTextContent('Real-time alerts turned off');
  });

  it('reverts and announces the error on failure', async () => {
    const input = mount();
    const { save, requests } = controlledSave();
    mgSwitchPending(input, { save });

    fireEvent.click(input);
    nextFrame();
    requests[0].reject(new Error('nope'));
    await flush();

    expect(input.checked).toBe(false);
    expect(input).toHaveAttribute('aria-busy', 'false');
    expect(requests[0].signal.aborted).toBe(true);
    expect(statusOf(input)).toHaveTextContent(
      'Could not save the change. Try again.'
    );
  });

  it('treats a save that throws synchronously as a failure', async () => {
    const input = mount();
    const failed = jest.fn();
    input.addEventListener('mg-switch:failed', failed);
    mgSwitchPending(input, {
      save: () => {
        throw new Error('sync');
      },
    });

    fireEvent.click(input);
    await flush();
    expect(input.checked).toBe(false);
    expect(failed.mock.calls[0][0].detail.error.message).toBe('sync');
  });

  it('times out, aborts and reverts a request that never settles', () => {
    const input = mount();
    const { save, requests } = controlledSave();
    mgSwitchPending(input, { save, timeout: 5000 });

    fireEvent.click(input);
    nextFrame();
    advance(4979);
    expect(input.checked).toBe(true);
    advance(1);

    expect(requests[0].signal.aborted).toBe(true);
    expect(requests[0].signal.reason.name).toBe('TimeoutError');
    expect(input.checked).toBe(false);
    expect(input).toHaveAttribute('aria-busy', 'false');
  });

  it('uses a 10 second timeout by default', () => {
    const input = mount();
    const { save } = controlledSave();
    mgSwitchPending(input, { save });

    fireEvent.click(input);
    advance(PENDING_TIMEOUT_MS - 1);
    expect(input.checked).toBe(true);
    advance(1);
    expect(input.checked).toBe(false);
  });

  it('ignores a late response from a request that already timed out', async () => {
    const input = mount();
    const { save, requests } = controlledSave();
    const settled = jest.fn();
    input.addEventListener('mg-switch:settled', settled);
    mgSwitchPending(input, { save, timeout: 5000 });
    const status = statusOf(input);

    fireEvent.click(input);
    advance(5000);
    fireEvent.click(input);
    nextFrame();
    requests[0].resolve();
    await flush();

    expect(save).toHaveBeenCalledTimes(2);
    expect(settled).not.toHaveBeenCalled();
    expect(input.checked).toBe(true);
    expect(input).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Saving…');

    requests[1].reject(new Error('nope'));
    await flush();
    expect(input.checked).toBe(false);
  });

  it('ignores clicks while pending and rate-limits "Still saving…"', () => {
    const input = mount();
    const { save } = controlledSave();
    mgSwitchPending(input, { save });
    const status = statusOf(input);

    fireEvent.click(input);
    nextFrame();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    input.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(input.checked).toBe(true);
    expect(status).toHaveTextContent('Still saving…');

    // Inside the interval: no new write, not even a clear.
    fireEvent.click(input);
    advance(STILL_SAVING_INTERVAL_MS - 1);
    fireEvent.click(input);
    expect(status).toHaveTextContent('Still saving…');

    advance(1);
    fireEvent.click(input);
    // Same text: cleared, then written again after a short delay.
    expect(status.textContent).toBe('');
    advance(100);
    expect(status).toHaveTextContent('Still saving…');
    expect(save).toHaveBeenCalledTimes(1);
    expect(input.checked).toBe(true);
  });

  it('undoes a change made by a script while pending', () => {
    const input = mount();
    const { save } = controlledSave();
    mgSwitchPending(input, { save });

    fireEvent.click(input);
    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(input.checked).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(statusOf(input)).toHaveTextContent('Still saving…');
  });

  it('dispatches pending, settled and failed events with their detail', async () => {
    const input = mount();
    const { save, requests } = controlledSave();
    const pending = jest.fn();
    const settled = jest.fn();
    const failed = jest.fn();
    document.addEventListener('mg-switch:pending', pending);
    document.addEventListener('mg-switch:settled', settled);
    document.addEventListener('mg-switch:failed', failed);
    mgSwitchPending(input, { save, timeout: 5000 });

    fireEvent.click(input);
    expect(pending).toHaveBeenCalledTimes(1);
    expect(pending.mock.calls[0][0].detail).toEqual({ checked: true });
    expect(pending.mock.calls[0][0].target).toBe(input);
    requests[0].resolve();
    await flush();
    expect(settled.mock.calls[0][0].detail).toEqual({
      checked: true,
      ok: true,
    });

    const error = new Error('nope');
    fireEvent.click(input);
    requests[1].reject(error);
    await flush();
    expect(failed.mock.calls[0][0].detail).toEqual({
      checked: true,
      requested: false,
      reason: 'error',
      error,
    });

    fireEvent.click(input);
    advance(5000);
    const timeout = failed.mock.calls[1][0].detail;
    expect(timeout.reason).toBe('timeout');
    expect(timeout.checked).toBe(true);
    expect(timeout.error.name).toBe('TimeoutError');

    document.removeEventListener('mg-switch:pending', pending);
    document.removeEventListener('mg-switch:settled', settled);
    document.removeEventListener('mg-switch:failed', failed);
  });

  it('takes labels from options, including {label} and functions', async () => {
    const input = mount();
    const { save, requests } = controlledSave();
    mgSwitchPending(input, {
      save,
      labels: {
        saving: 'Saving {label}',
        on: (label, element) => `${label} on (${element.id})`,
      },
    });
    const status = statusOf(input);

    fireEvent.click(input);
    expect(status).toHaveTextContent('Saving Real-time alerts');
    requests[0].resolve();
    await flush();
    expect(status).toHaveTextContent('Real-time alerts on (alerts)');
  });

  it('reads data-mg-switch-labels from the label and input, options winning', async () => {
    const input = mount({
      labelAttrs: `data-mg-switch-labels='{"saving":"جارٍ الحفظ…","error":"label error"}'`,
      inputAttrs: `data-mg-switch-labels='{"error":"تعذّر الحفظ","off":"{label} متوقف"}'`,
    });
    const { save, requests } = controlledSave();
    mgSwitchPending(input, { save, labels: { stillSaving: 'لا يزال' } });
    const status = statusOf(input);

    fireEvent.click(input);
    expect(status).toHaveTextContent('جارٍ الحفظ…');
    fireEvent.click(input);
    expect(status).toHaveTextContent('لا يزال');
    requests[0].reject(new Error('nope'));
    await flush();
    expect(status).toHaveTextContent('تعذّر الحفظ');
  });

  it('ignores malformed data-mg-switch-labels', () => {
    const input = mount({ inputAttrs: `data-mg-switch-labels="{nope"` });
    mgSwitchPending(input, { save: controlledSave().save });
    fireEvent.click(input);
    expect(statusOf(input)).toHaveTextContent('Saving…');
  });

  it('creates a visually hidden status region and removes it on destroy', () => {
    const input = mount();
    const helper = mgSwitchPending(input, { save: controlledSave().save });
    const status = statusOf(input);

    expect(status).not.toBeNull();
    expect(status.tagName).toBe('SPAN');
    expect(status).toHaveClass('mg-u-sr-only');
    expect(input).toHaveAttribute('data-mg-switch-pending-enhanced');

    helper.destroy();
    expect(document.querySelector('[role="status"]')).toBeNull();
    expect(input).not.toHaveAttribute('data-mg-switch-pending-enhanced');
  });

  it('uses options.status, data-mg-switch-status or a live aria-describedby target', () => {
    document.body.innerHTML = `
      ${switchMarkup({ id: 'a', inputAttrs: 'aria-describedby="help a-live"' })}
      <p id="help">Help text</p>
      <p id="a-live" role="status"></p>
      ${switchMarkup({ id: 'b', inputAttrs: 'data-mg-switch-status="b-live"' })}
      <p id="b-live" aria-live="polite"></p>
      ${switchMarkup({ id: 'c' })}
      <p class="c-live" role="status"></p>`;
    const { save } = controlledSave();
    const helpers = [
      mgSwitchPending(document.getElementById('a'), { save }),
      mgSwitchPending(document.getElementById('b'), { save }),
      mgSwitchPending(document.getElementById('c'), {
        save,
        status: '.c-live',
      }),
    ];

    expect(
      document.querySelectorAll('[data-mg-switch-status-created]')
    ).toHaveLength(0);
    ['a', 'b', 'c'].forEach(id => fireEvent.click(document.getElementById(id)));
    expect(document.getElementById('help')).toHaveTextContent('Help text');
    expect(document.getElementById('a-live')).toHaveTextContent('Saving…');
    expect(document.getElementById('b-live')).toHaveTextContent('Saving…');
    expect(document.querySelector('.c-live')).toHaveTextContent('Saving…');

    helpers.forEach(helper => helper.destroy());
    // A region the page owns is left in place.
    expect(document.getElementById('a-live')).toBeInTheDocument();
  });

  it('returns the existing helper when an input is enhanced twice', () => {
    const input = mount();
    const { save } = controlledSave();
    const first = mgSwitchPending(input, { save });
    expect(mgSwitchPending(input, { save })).toBe(first);
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
  });

  it('destroy removes every listener, timer and marker and leaves checked', () => {
    const input = mount();
    const controller = new AbortController();
    const inputListeners = trackListeners(input);
    const signalListeners = trackListeners(controller.signal);
    const { save, requests } = controlledSave();
    const helper = mgSwitchPending(input, {
      save,
      signal: controller.signal,
    });
    expect(inputListeners()).toBe(2);
    expect(signalListeners()).toBe(1);

    fireEvent.click(input);
    fireEvent.click(input);
    helper.destroy();
    helper.destroy();

    expect(inputListeners()).toBe(0);
    expect(signalListeners()).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
    expect(requests[0].signal.aborted).toBe(true);
    expect(input.checked).toBe(true);
    expect(input).not.toHaveAttribute('aria-busy');

    // The input is a plain checkbox again.
    fireEvent.click(input);
    expect(input.checked).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('destroys when its signal aborts, and does nothing for an aborted signal', () => {
    const input = mount();
    const controller = new AbortController();
    const { save } = controlledSave();
    mgSwitchPending(input, { save, signal: controller.signal });
    expect(statusOf(input)).not.toBeNull();

    controller.abort();
    expect(statusOf(input)).toBeNull();
    expect(input).not.toHaveAttribute('data-mg-switch-pending-enhanced');

    const helper = mgSwitchPending(input, { save, signal: controller.signal });
    fireEvent.click(input);
    expect(save).not.toHaveBeenCalled();
    expect(() => helper.destroy()).not.toThrow();
  });

  describe('without a save function', () => {
    it('asks a mg-switch:save listener, which answers with respondWith', async () => {
      const input = mount();
      let seen;
      const listener = event => {
        seen = event;
        // Destructured, as in the docs: respondWith does not rely on `this`.
        const { respondWith } = event.detail;
        respondWith(Promise.resolve());
      };
      document.addEventListener('mg-switch:save', listener);
      mgSwitchPending(input);

      fireEvent.click(input);
      expect(seen.cancelable).toBe(true);
      expect(seen.defaultPrevented).toBe(true);
      expect(seen.target).toBe(input);
      expect(seen.detail.checked).toBe(true);
      expect(seen.detail.signal).toBeInstanceOf(AbortSignal);
      expect(() => seen.detail.respondWith(Promise.resolve())).toThrow(
        /already called/
      );
      await flush();
      expect(input.checked).toBe(true);
      expect(statusOf(input)).toHaveTextContent('Real-time alerts turned on');
      document.removeEventListener('mg-switch:save', listener);
    });

    it('lets a listener that called preventDefault() respond after an await', async () => {
      const input = mount();
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      let finishSave;
      const listener = async event => {
        event.preventDefault();
        await Promise.resolve('token');
        event.detail.respondWith(
          new Promise(resolve => {
            finishSave = resolve;
          })
        );
      };
      document.addEventListener('mg-switch:save', listener);
      mgSwitchPending(input);

      fireEvent.click(input);
      await flush();
      expect(warn).not.toHaveBeenCalled();
      expect(input.checked).toBe(true);
      expect(statusOf(input)).toHaveTextContent('Saving…');

      finishSave();
      await flush();
      await flush();
      expect(input.checked).toBe(true);
      expect(statusOf(input)).toHaveTextContent('Real-time alerts turned on');
      document.removeEventListener('mg-switch:save', listener);
    });

    it('times out a claimed save that never responds, and ignores a later response', async () => {
      const input = mount();
      const failed = jest.fn();
      input.addEventListener('mg-switch:failed', failed);
      let claimed;
      const listener = event => {
        event.preventDefault();
        claimed = event;
      };
      document.addEventListener('mg-switch:save', listener);
      mgSwitchPending(input, { timeout: 5000 });

      fireEvent.click(input);
      advance(5000);
      expect(input.checked).toBe(false);
      expect(failed.mock.calls[0][0].detail.reason).toBe('timeout');
      expect(claimed.detail.signal.aborted).toBe(true);

      expect(() => claimed.detail.respondWith(Promise.resolve())).not.toThrow();
      await flush();
      expect(input.checked).toBe(false);
      expect(failed).toHaveBeenCalledTimes(1);
      document.removeEventListener('mg-switch:save', listener);
    });

    it('explains a late respondWith() from a listener that did not claim the save', async () => {
      const input = mount();
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      let late;
      const listener = async event => {
        await Promise.resolve();
        try {
          event.detail.respondWith(Promise.resolve());
        } catch (error) {
          late = error;
        }
      };
      document.addEventListener('mg-switch:save', listener);
      mgSwitchPending(input);

      fireEvent.click(input);
      await flush();
      expect(input.checked).toBe(false);
      expect(late.message).toMatch(/preventDefault\(\)/);
      document.removeEventListener('mg-switch:save', listener);
    });

    it('rejects a second respondWith call', () => {
      const input = mount();
      let second;
      const listener = event => {
        event.detail.respondWith(new Promise(() => {}));
        try {
          event.detail.respondWith(Promise.resolve());
        } catch (error) {
          second = error;
        }
      };
      document.addEventListener('mg-switch:save', listener);
      mgSwitchPending(input);
      fireEvent.click(input);
      expect(second.message).toMatch(/already called/);
      document.removeEventListener('mg-switch:save', listener);
    });

    it('warns and reverts when nobody responds', async () => {
      const input = mount();
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const failed = jest.fn();
      input.addEventListener('mg-switch:failed', failed);
      mgSwitchPending(input);

      fireEvent.click(input);
      await flush();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(/respondWith/);
      expect(input.checked).toBe(false);
      expect(failed.mock.calls[0][0].detail.reason).toBe('error');
      expect(statusOf(input)).toHaveTextContent(
        'Could not save the change. Try again.'
      );
    });
  });

  it('treats a plain value or a thenable from save as the result', async () => {
    document.body.innerHTML = `${switchMarkup({ id: 'plain' })}${switchMarkup({ id: 'thenable' })}`;
    const plain = document.getElementById('plain');
    const thenable = document.getElementById('thenable');
    let rejectThenable;
    mgSwitchPending(plain, { save: () => true });
    mgSwitchPending(thenable, {
      save: () => ({
        then(onFulfilled, onRejected) {
          rejectThenable = onRejected;
        },
      }),
    });

    fireEvent.click(plain);
    fireEvent.click(thenable);
    await flush();
    await flush();
    expect(plain.checked).toBe(true);
    expect(plain).toHaveAttribute('aria-busy', 'false');
    expect(thenable.checked).toBe(true);

    rejectThenable(new Error('nope'));
    await flush();
    expect(thenable.checked).toBe(false);
  });

  it('keeps the saved position when a form reset moves the switch mid-request', async () => {
    document.body.innerHTML = `<form>${switchMarkup()}</form>`;
    const input = document.querySelector('.mg-switch__input');
    const { save, requests } = controlledSave();
    mgSwitchPending(input, { save });

    fireEvent.click(input);
    input.form.reset();
    expect(input.checked).toBe(false);
    requests[0].resolve();
    await flush();
    expect(input.checked).toBe(true);
    expect(statusOf(input)).toHaveTextContent('Real-time alerts turned on');
  });

  it('does not let one switch cancel or overwrite another in a shared region', () => {
    document.body.innerHTML = `
      ${switchMarkup({ id: 'a', label: 'Alerts' })}
      ${switchMarkup({ id: 'b', label: 'Layers' })}
      <p id="shared" role="status"></p>`;
    const a = document.getElementById('a');
    const b = document.getElementById('b');
    const status = document.getElementById('shared');
    const { save } = controlledSave();
    const helperA = mgSwitchPending(a, { save, status });
    mgSwitchPending(b, { save, status });

    fireEvent.click(a);
    fireEvent.click(a);
    advance(STILL_SAVING_INTERVAL_MS);
    // Same text again: cleared, with a rewrite scheduled.
    fireEvent.click(a);
    expect(status.textContent).toBe('');
    fireEvent.click(b);
    expect(status).toHaveTextContent('Saving…');
    advance(200);
    expect(status).toHaveTextContent('Saving…');

    // Destroying A does not cancel a rewrite B scheduled.
    fireEvent.click(b);
    advance(STILL_SAVING_INTERVAL_MS);
    fireEvent.click(b);
    expect(status.textContent).toBe('');
    helperA.destroy();
    advance(100);
    expect(status).toHaveTextContent('Still saving…');
  });

  it('says nothing about a switch that left the page, but still settles it', async () => {
    document.body.innerHTML = `<div id="wrap">${switchMarkup()}</div><p id="page-status" role="status"></p>`;
    const input = document.querySelector('.mg-switch__input');
    const status = document.getElementById('page-status');
    const settled = jest.fn();
    input.addEventListener('mg-switch:settled', settled);
    const { save, requests } = controlledSave();
    mgSwitchPending(input, { save, status });

    fireEvent.click(input);
    document.getElementById('wrap').remove();
    status.textContent = '';
    requests[0].resolve();
    await flush();
    expect(status.textContent).toBe('');
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it('removes its own region when the switch leaves mid-request, and follows a moved switch', async () => {
    document.body.innerHTML = `<div id="old">${switchMarkup()}</div><div id="new"></div>`;
    const input = document.querySelector('.mg-switch__input');
    const label = input.closest('label');
    const { save, requests } = controlledSave();
    mgSwitchPending(input, { save });

    fireEvent.click(input);
    label.remove();
    requests[0].resolve();
    await flush();
    expect(
      document.querySelectorAll('[data-mg-switch-status-created]')
    ).toHaveLength(0);

    document.getElementById('new').append(label);
    fireEvent.click(input);
    expect(label.nextElementSibling).toHaveAttribute(
      'data-mg-switch-status-created'
    );
    expect(label.nextElementSibling).toHaveTextContent('Saving…');
    expect(
      document.querySelectorAll('[data-mg-switch-status-created]')
    ).toHaveLength(1);
  });

  describe('label text', () => {
    const announceOn = async (input, labels) => {
      const { save, requests } = controlledSave();
      mgSwitchPending(input, { save, labels });
      fireEvent.click(input);
      requests[0].resolve();
      await flush();
    };

    it('follows aria-labelledby, then aria-label, then the label', async () => {
      document.body.innerHTML = `
        <span id="name-a">Flood</span> <span id="name-b">warnings</span>
        ${switchMarkup({ id: 'by', inputAttrs: 'aria-labelledby="name-a name-b" aria-label="Ignored"' })}
        ${switchMarkup({ id: 'aria', label: '', inputAttrs: 'aria-label="Map layer"' })}`;
      await announceOn(document.getElementById('by'));
      await announceOn(document.getElementById('aria'));
      const regions = document.querySelectorAll(
        '[data-mg-switch-status-created]'
      );
      expect(regions[0]).toHaveTextContent('Flood warnings turned on');
      expect(regions[1]).toHaveTextContent('Map layer turned on');
    });

    it('trims a {label} placeholder when the switch has no label text', async () => {
      const input = mount({ label: '' });
      await announceOn(input, { on: '{label} on' });
      expect(statusOf(input).textContent).toBe('on');
    });

    it('leaves live regions out of the label text, and warns about one inside the label', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      document.body.innerHTML = `
        <label class="mg-switch">
          <input type="checkbox" role="switch" class="mg-switch__input" />
          Real-time alerts
          <span class="inside" role="status">Old message</span>
        </label>`;
      const input = document.querySelector('.mg-switch__input');
      const { save, requests } = controlledSave();
      mgSwitchPending(input, { save, status: '.inside' });
      expect(warn.mock.calls[0][0]).toMatch(/inside the switch label/);

      fireEvent.click(input);
      requests[0].resolve();
      await flush();
      expect(document.querySelector('.inside').textContent).toBe(
        'Real-time alerts turned on'
      );
    });
  });

  it('places a created region after the label, outside the accessible name', () => {
    const input = mount();
    mgSwitchPending(input, { save: controlledSave().save });
    fireEvent.click(input);
    const label = input.closest('label');
    expect(label.querySelector('[role="status"]')).toBeNull();
    expect(label.nextElementSibling).toHaveAttribute(
      'data-mg-switch-status-created'
    );
    expect(label.textContent).not.toMatch(/Saving/);
  });

  it('releases every listener across repeated init and destroy on a long-lived signal', () => {
    document.body.innerHTML = switchMarkup({
      inputAttrs: 'data-mg-switch-pending',
    });
    const input = document.querySelector('.mg-switch__input');
    const controller = new AbortController();
    const inputListeners = trackListeners(input);
    const signalListeners = trackListeners(controller.signal);
    const { save } = controlledSave();

    for (let i = 0; i < 50; i += 1) {
      mgSwitchPendingInit(document, { save, signal: controller.signal });
      fireEvent.click(input);
      nextFrame();
      mgSwitchPendingDestroy(document);
    }

    expect(inputListeners()).toBe(0);
    expect(signalListeners()).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(0);
    expect(input).not.toHaveAttribute('aria-busy');
  });

  it('has no a11y violations while pending', async () => {
    jest.useRealTimers();
    document.body.innerHTML = `<main>${switchMarkup()}</main>`;
    const input = document.querySelector('.mg-switch__input');
    mgSwitchPending(input, { save: () => new Promise(() => {}) });
    fireEvent.click(input);
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(input).toHaveAttribute('aria-busy', 'true');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe('mgSwitchPendingInit', () => {
  afterEach(() => {
    mgSwitchPendingDestroy(document);
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('enhances marked inputs and labels within scope, once', () => {
    document.body.innerHTML = `
      <section id="inside">
        ${switchMarkup({ id: 'one', inputAttrs: 'data-mg-switch-pending' })}
        ${switchMarkup({ id: 'two', labelAttrs: 'data-mg-switch-pending' })}
        ${switchMarkup({ id: 'unmarked' })}
      </section>
      <section id="outside">
        ${switchMarkup({ id: 'three', inputAttrs: 'data-mg-switch-pending' })}
      </section>`;
    const inside = document.getElementById('inside');

    const handles = mgSwitchPendingInit(inside);
    expect(handles).toHaveLength(2);
    const enhanced = () =>
      Array.from(
        document.querySelectorAll('[data-mg-switch-pending-enhanced]')
      ).map(input => input.id);
    expect(enhanced()).toEqual(['one', 'two']);

    expect(mgSwitchPendingInit(inside)).toHaveLength(0);
    expect(mgSwitchPendingInit(document)).toHaveLength(1);
    expect(enhanced()).toEqual(['one', 'two', 'three']);
    expect(
      document.querySelectorAll('[data-mg-switch-status-created]')
    ).toHaveLength(3);
  });

  it('accepts the scope element itself and a list of elements', () => {
    document.body.innerHTML = `
      ${switchMarkup({ id: 'one', labelAttrs: 'data-mg-switch-pending' })}
      ${switchMarkup({ id: 'two', inputAttrs: 'data-mg-switch-pending' })}`;
    const labels = document.querySelectorAll('label');
    expect(mgSwitchPendingInit(labels[0])).toHaveLength(1);
    expect(mgSwitchPendingInit([document.getElementById('two')])).toHaveLength(
      1
    );
  });

  it('shares options, and a signal destroys only what that call enhanced', () => {
    document.body.innerHTML = `
      ${switchMarkup({ id: 'early', inputAttrs: 'data-mg-switch-pending' })}
      <div id="region">
        ${switchMarkup({ id: 'late', inputAttrs: 'data-mg-switch-pending' })}
      </div>`;
    const save = jest.fn(() => new Promise(() => {}));
    mgSwitchPendingInit(document.getElementById('early').closest('label'));
    const controller = new AbortController();
    mgSwitchPendingInit(document, { save, signal: controller.signal });

    fireEvent.click(document.getElementById('late'));
    expect(save).toHaveBeenCalledWith(true, expect.any(AbortSignal));

    controller.abort();
    expect(document.getElementById('late')).not.toHaveAttribute(
      'data-mg-switch-pending-enhanced'
    );
    expect(document.getElementById('early')).toHaveAttribute(
      'data-mg-switch-pending-enhanced'
    );
    expect(
      mgSwitchPendingInit(document, { signal: controller.signal })
    ).toEqual([]);
  });

  it('mgSwitchPendingDestroy releases enhanced switches in scope', () => {
    document.body.innerHTML = `
      <div id="a">${switchMarkup({ id: 'one', inputAttrs: 'data-mg-switch-pending' })}</div>
      <div id="b">${switchMarkup({ id: 'two', inputAttrs: 'data-mg-switch-pending' })}</div>`;
    mgSwitchPendingInit();
    mgSwitchPendingDestroy(document.getElementById('a'));
    expect(document.getElementById('one')).not.toHaveAttribute(
      'data-mg-switch-pending-enhanced'
    );
    expect(document.getElementById('two')).toHaveAttribute(
      'data-mg-switch-pending-enhanced'
    );
    mgSwitchPendingDestroy(document.getElementById('two'));
    expect(
      document.querySelectorAll('[data-mg-switch-status-created]')
    ).toHaveLength(0);
  });
});

describe('auto-initialisation', () => {
  afterEach(() => {
    jest.resetModules();
    document.body.innerHTML = '';
  });

  it('enhances marked switches on load unless they skip auto-init', () => {
    document.body.innerHTML = `
      ${switchMarkup({ id: 'auto', inputAttrs: 'data-mg-switch-pending' })}
      ${switchMarkup({ id: 'skip', labelAttrs: 'data-mg-switch-pending data-mg-switch-pending-skip-auto-init' })}`;
    jest.isolateModules(() => {
      require('../../../../assets/js/switch-pending');
    });
    expect(document.getElementById('auto')).toHaveAttribute(
      'data-mg-switch-pending-enhanced'
    );
    expect(document.getElementById('skip')).not.toHaveAttribute(
      'data-mg-switch-pending-enhanced'
    );
  });

  it('hands auto-initialised switches to a later explicit call with options', () => {
    document.body.innerHTML = switchMarkup({
      id: 'auto',
      inputAttrs: 'data-mg-switch-pending',
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let module;
    jest.isolateModules(() => {
      module = require('../../../../assets/js/switch-pending');
    });
    const input = document.getElementById('auto');
    expect(input).toHaveAttribute('data-mg-switch-pending-enhanced');

    const save = jest.fn(() => new Promise(() => {}));
    expect(module.mgSwitchPendingInit(document, { save })).toHaveLength(1);
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
    fireEvent.click(input);
    expect(save).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();

    // Explicit helpers are not taken over again.
    expect(module.mgSwitchPendingInit(document, { save: jest.fn() })).toEqual(
      []
    );
    module.mgSwitchPendingDestroy(document);
    warn.mockRestore();
  });

  it('shares one registry between two copies of the module', () => {
    document.body.innerHTML = switchMarkup({
      id: 'twice',
      inputAttrs: 'data-mg-switch-pending',
    });
    let first;
    let second;
    jest.isolateModules(() => {
      first = require('../../../../assets/js/switch-pending');
    });
    jest.isolateModules(() => {
      second = require('../../../../assets/js/switch-pending');
    });
    const input = document.getElementById('twice');
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);

    const save = jest.fn(() => new Promise(() => {}));
    const helper = first.mgSwitchPending(input, { save });
    const otherSave = jest.fn();
    expect(second.mgSwitchPending(input, { save: otherSave })).toBe(helper);
    expect(second.mgSwitchPendingInit(document)).toEqual([]);

    const pending = jest.fn();
    input.addEventListener('mg-switch:pending', pending);
    fireEvent.click(input);
    expect(save).toHaveBeenCalledTimes(1);
    expect(otherSave).not.toHaveBeenCalled();
    expect(pending).toHaveBeenCalledTimes(1);

    second.mgSwitchPendingDestroy(document);
    expect(input).not.toHaveAttribute('data-mg-switch-pending-enhanced');
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(0);
  });
});
