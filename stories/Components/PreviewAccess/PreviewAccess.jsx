import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  mgPreviewAccess,
  mgPreviewAccessDestroy,
} from '../../assets/js/preview-access';

const DEFAULT_MESSAGE =
  'This page is in preview and is not yet ready for general distribution. ' +
  'Please enter the access PIN provided by UNDRR to continue.';

/**
 * Storybook / docs preview of the preview-access modal panel.
 *
 * Renders a static visual preview of the modal markup — useful for previewing
 * copy, RTL layout, and theme application without actually gating Storybook.
 * To activate the real body-level gate behaviour, pass `live`. The live mode
 * renders the trigger div and calls the vanilla mgPreviewAccess() runtime; on
 * unmount it removes the overlay and restores body siblings.
 *
 * For production pages, prefer dropping `<div data-mg-preview-access>` directly
 * into the HTML and loading js/preview-access.js — the gate is fundamentally a
 * page-level concern, not a subtree component.
 *
 * @param {Object}  props
 * @param {boolean} [props.live]            When true, mounts the real gate.
 * @param {string}  [props.pin]             Unlock PIN.
 * @param {string}  [props.id]              sessionStorage scope key.
 * @param {string}  [props.eyebrow]         Small uppercase label above the title.
 * @param {string}  [props.title]           Modal heading.
 * @param {string}  [props.message]         Modal body copy.
 * @param {string}  [props.contactUrl]      Help link URL.
 * @param {string}  [props.contactLabel]    Help link visible text.
 * @param {string}  [props.pinLabel]        Form label for the PIN input.
 * @param {string}  [props.submitLabel]     Submit button label.
 * @param {string}  [props.errorMessage]    Error message text on a wrong PIN.
 */
export default function PreviewAccess({
  live = false,
  pin = '5498',
  id = null,
  eyebrow = 'UNDRR · Preview',
  title = 'Preview access required',
  message = DEFAULT_MESSAGE,
  contactUrl = 'https://www.undrr.org/contact-us',
  contactLabel = 'Need help? Contact UNDRR',
  pinLabel = 'Access PIN',
  submitLabel = 'Unlock',
  errorMessage = 'That PIN is not correct. Please try again.',
}) {
  const gateRef = useRef(null);

  useEffect(() => {
    if (!live) return undefined;
    const gate = gateRef.current;
    if (!gate) return undefined;
    delete gate.dataset.mgPreviewAccessInitialized;
    mgPreviewAccess([gate]);
    return () => {
      if (gate) mgPreviewAccessDestroy(gate);
    };
  }, [
    live,
    pin,
    id,
    eyebrow,
    title,
    message,
    contactUrl,
    contactLabel,
    pinLabel,
    submitLabel,
    errorMessage,
  ]);

  if (live) {
    return (
      <div
        ref={gateRef}
        data-mg-preview-access=""
        data-mg-preview-pin={pin}
        {...(id && { 'data-mg-preview-id': id })}
        data-mg-preview-eyebrow={eyebrow}
        data-mg-preview-title={title}
        data-mg-preview-message={message}
        data-mg-preview-contact-url={contactUrl}
        data-mg-preview-contact-label={contactLabel}
        data-mg-preview-pin-label={pinLabel}
        data-mg-preview-submit-label={submitLabel}
        data-mg-preview-error-message={errorMessage}
      />
    );
  }

  return (
    <div className="mg-preview-access__modal">
      <p className="mg-preview-access__eyebrow">{eyebrow}</p>
      <h2 className="mg-preview-access__title">{title}</h2>
      <p className="mg-preview-access__body">{message}</p>
      <form
        className="mg-preview-access__form"
        noValidate
        onSubmit={e => e.preventDefault()}
      >
        <label className="mg-preview-access__label" htmlFor="mg-preview-access-pin-preview">
          {pinLabel}
        </label>
        <div className="mg-preview-access__field">
          <input
            className="mg-preview-access__input"
            id="mg-preview-access-pin-preview"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck="false"
          />
          <button className="mg-preview-access__submit" type="submit">
            {submitLabel}
          </button>
        </div>
        <p className="mg-preview-access__error" role="status" aria-live="polite" />
      </form>
      <p className="mg-preview-access__contact">
        <a href={contactUrl}>{contactLabel}</a>
      </p>
    </div>
  );
}

PreviewAccess.propTypes = {
  /** When true, mount the real body-level gate (overlay + inert siblings). */
  live: PropTypes.bool,
  /** PIN that unlocks the page. */
  pin: PropTypes.string,
  /** sessionStorage scope key. Defaults to location.pathname when null. */
  id: PropTypes.string,
  /** Small uppercase label above the title. */
  eyebrow: PropTypes.string,
  /** Modal heading. */
  title: PropTypes.string,
  /** Modal body copy. */
  message: PropTypes.string,
  /** Help link URL. */
  contactUrl: PropTypes.string,
  /** Help link visible text. */
  contactLabel: PropTypes.string,
  /** Form label for the PIN input. */
  pinLabel: PropTypes.string,
  /** Submit button label. */
  submitLabel: PropTypes.string,
  /** Error message text on a wrong PIN. */
  errorMessage: PropTypes.string,
};
