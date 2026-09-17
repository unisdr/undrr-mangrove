/**
 * @file _switchPending.jsx
 * @description Story helpers for the `.mg-switch` pending state: localised
 * captions, a static pending row and the interactive demo. The demo mirrors
 * the vanilla example in Checkbox.mdx, so its tests cover that logic too.
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/** A request that has not settled by then reverts the switch. */
export const PENDING_TIMEOUT_MS = 10000;

/** "Still saving" is announced at most this often. */
export const STILL_SAVING_INTERVAL_MS = 3000;

export const getSwitchCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        alertsLabel: 'تنبيهات فورية',
        layerLabel: 'طبقة الخريطة النشطة',
        turningOn: 'جارٍ التشغيل',
        turningOff: 'جارٍ الإيقاف',
        saving: 'جارٍ الحفظ…',
        stillSaving: 'لا يزال الحفظ جاريًا…',
        enabled: 'تم تفعيل التنبيهات الفورية',
        disabled: 'تم إيقاف التنبيهات الفورية',
        failed: 'تعذّر حفظ التغيير. حاول مرة أخرى.',
      };
    case 'japanese':
      return {
        alertsLabel: 'リアルタイム通知',
        layerLabel: '表示中の地図レイヤー',
        turningOn: 'オンに切り替え中',
        turningOff: 'オフに切り替え中',
        saving: '保存中…',
        stillSaving: 'まだ保存中です…',
        enabled: 'リアルタイム通知をオンにしました',
        disabled: 'リアルタイム通知をオフにしました',
        failed: '変更を保存できませんでした。もう一度お試しください。',
      };
    default:
      return {
        alertsLabel: 'Real-time alerts',
        layerLabel: 'Active map layer',
        turningOn: 'Turning on',
        turningOff: 'Turning off',
        saving: 'Saving…',
        stillSaving: 'Still saving…',
        enabled: 'Real-time alerts turned on',
        disabled: 'Real-time alerts turned off',
        failed: 'Could not save the change. Try again.',
      };
  }
};

const captionShape = PropTypes.shape({
  alertsLabel: PropTypes.string.isRequired,
  saving: PropTypes.string.isRequired,
  stillSaving: PropTypes.string.isRequired,
  enabled: PropTypes.string.isRequired,
  disabled: PropTypes.string.isRequired,
  failed: PropTypes.string.isRequired,
});

/**
 * A static pending switch with a note that describes it.
 *
 * @param {Object} props
 * @param {string} props.label    Switch label
 * @param {string} props.note     What the pending switch is doing
 * @param {boolean} [props.checked=false] The requested position
 */
export function PendingSwitchRow({ label, note, checked = false }) {
  const noteId = useId();
  return (
    <div>
      <label className="mg-switch">
        <input
          type="checkbox"
          role="switch"
          className="mg-switch__input"
          aria-busy="true"
          aria-describedby={noteId}
          defaultChecked={checked}
        />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">{label}</span>
      </label>
      <p className="mg-form-help" id={noteId}>
        {note}
      </p>
    </div>
  );
}

PendingSwitchRow.propTypes = {
  label: PropTypes.string.isRequired,
  note: PropTypes.string.isRequired,
  checked: PropTypes.bool,
};

/**
 * Builds a fake save for the story. It honours the abort signal, like a
 * fetch() would.
 *
 * @param {'success'|'failure'|'timeout'} outcome How the request ends
 * @param {number} [delay=1500] Milliseconds before it settles
 * @returns {(requested: boolean, signal: AbortSignal) => Promise<void>}
 */
export const simulateSave =
  (outcome, delay = 1500) =>
  (requested, signal) =>
    new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason));
      if (outcome === 'timeout') return;
      setTimeout(
        outcome === 'failure'
          ? () => reject(new Error('Simulated failure'))
          : resolve,
        delay
      );
    });

/**
 * Interactive pending switch.
 *
 * - The thumb moves at once; `aria-busy` follows a frame later, so the new
 *   checked state is announced before the control is marked busy.
 * - Presses while pending are ignored and "Still saving" is announced, at most
 *   once every STILL_SAVING_INTERVAL_MS.
 * - Only the request in flight can settle the switch, so a late response
 *   after a timeout is ignored.
 * - A request that has not settled after `timeoutMs` is aborted and reverts.
 *
 * @param {Object} props
 * @param {Object} props.caption  Localised strings
 * @param {Function} props.save   `(requested, signal) => Promise`
 * @param {number} [props.timeoutMs=PENDING_TIMEOUT_MS] Request timeout
 */
export function PendingSwitchDemo({
  caption,
  save,
  timeoutMs = PENDING_TIMEOUT_MS,
}) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  // Each message gets a new key, so repeating a message re-announces it.
  const [status, setStatus] = useState({ text: '', key: 0 });
  const current = useRef(null);
  const lastNudge = useRef(-Infinity);

  useEffect(
    () => () => {
      const request = current.current;
      current.current = null;
      if (request) {
        clearTimeout(request.timer);
        cancelAnimationFrame(request.frame);
        request.controller.abort();
      }
    },
    []
  );

  const announce = text => setStatus(prev => ({ text, key: prev.key + 1 }));

  const handleChange = event => {
    if (current.current) {
      // Not updating `checked` leaves the switch where it is.
      const now = Date.now();
      if (now - lastNudge.current >= STILL_SAVING_INTERVAL_MS) {
        lastNudge.current = now;
        announce(caption.stillSaving);
      }
      return;
    }

    const requested = event.target.checked;
    const request = { controller: new AbortController() };
    current.current = request;
    setChecked(requested);
    announce(caption.saving);
    request.frame = requestAnimationFrame(() => {
      if (current.current === request) setBusy(true);
    });

    const settle = ok => {
      // Stale: this request already timed out, or the demo unmounted.
      if (current.current !== request) return;
      current.current = null;
      clearTimeout(request.timer);
      cancelAnimationFrame(request.frame);
      setBusy(false);
      if (ok) {
        announce(requested ? caption.enabled : caption.disabled);
        return;
      }
      request.controller.abort();
      setChecked(!requested);
      announce(caption.failed);
    };

    request.timer = setTimeout(() => settle(false), timeoutMs);
    save(requested, request.controller.signal).then(
      () => settle(true),
      () => settle(false)
    );
  };

  return (
    <div>
      <label className="mg-switch">
        <input
          type="checkbox"
          role="switch"
          className="mg-switch__input"
          checked={checked}
          aria-busy={busy}
          onChange={handleChange}
        />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">{caption.alertsLabel}</span>
      </label>
      <p className="mg-form-help" role="status">
        <span key={status.key}>{status.text}</span>
      </p>
    </div>
  );
}

PendingSwitchDemo.propTypes = {
  caption: captionShape.isRequired,
  save: PropTypes.func.isRequired,
  timeoutMs: PropTypes.number,
};
