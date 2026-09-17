/**
 * @file _switchPending.jsx
 * @description Story helpers for the `.mg-switch` pending state: localised
 * captions, a static pending row and the interactive demo. The demo runs the
 * shipped vanilla helper, so the story and the docs describe one behaviour.
 */

import React, { useEffect, useId, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  mgSwitchPending,
  PENDING_TIMEOUT_MS,
  STILL_SAVING_INTERVAL_MS,
} from '../../../assets/js/switch-pending';

export { PENDING_TIMEOUT_MS, STILL_SAVING_INTERVAL_MS };

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
 * Interactive pending switch, driven by the shipped vanilla helper
 * (`stories/assets/js/switch-pending.js`), so the story and non-React sites
 * run the same code.
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
  const inputRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    const helper = mgSwitchPending(inputRef.current, {
      save,
      timeout: timeoutMs,
      status: statusRef.current,
      labels: {
        saving: caption.saving,
        stillSaving: caption.stillSaving,
        error: caption.failed,
        on: caption.enabled,
        off: caption.disabled,
      },
    });
    return () => helper.destroy();
  }, [caption, save, timeoutMs]);

  return (
    <div>
      <label className="mg-switch">
        <input
          ref={inputRef}
          type="checkbox"
          role="switch"
          className="mg-switch__input"
          aria-busy="false"
        />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">{caption.alertsLabel}</span>
      </label>
      <p className="mg-form-help" role="status" ref={statusRef}></p>
    </div>
  );
}

PendingSwitchDemo.propTypes = {
  caption: captionShape.isRequired,
  save: PropTypes.func.isRequired,
  timeoutMs: PropTypes.number,
};
