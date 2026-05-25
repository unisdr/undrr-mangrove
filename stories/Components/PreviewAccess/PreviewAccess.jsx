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
 * Renders a static visual preview of the modal markup, useful for previewing
 * copy, theme, and RTL without actually gating Storybook. To activate the
 * real body-level gate behaviour, pass `live`. In `live` mode the runtime
 * appends the overlay to `document.body` (not into the React tree). On
 * unmount it removes the overlay and restores body siblings.
 *
 * For production pages, prefer dropping `<div data-mg-preview-access>` into
 * the HTML directly and loading js/preview-access.js. The gate is
 * fundamentally a page-level concern, not a subtree component.
 *
 * @param {Object}  props
 * @param {boolean} [props.live]            When true, mounts the real gate.
 * @param {string}  [props.pin]             Unlock PIN.
 * @param {string}  [props.id]              sessionStorage scope key.
 * @param {string}  [props.eyebrow]         Small label above the title.
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

  // Only mount/unmount on `live` toggles; copy-prop edits update the data
  // attributes in place via React's normal render path. The runtime reads
  // attributes once at init, so changing copy after mount is intentionally
  // a no-op — keeping the gate stable avoids overlay flicker and lost focus.
  useEffect(() => {
    if (!live) return undefined;
    const gate = gateRef.current;
    if (!gate) return undefined;
    delete gate.dataset.mgPreviewAccessInitialized;
    mgPreviewAccess([gate]);
    return () => {
      if (gate) mgPreviewAccessDestroy(gate);
    };
  }, [live]);

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

  // Static preview: mirrors the runtime's modal panel structure so reviewers
  // see the same markup that ships in production. Form is wired to no-op so
  // the user can still tab through, but the gate behaviour is not active.
  return (
    <div
      className="mg-preview-access__modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mg-preview-access-title-preview"
      aria-describedby="mg-preview-access-body-preview"
    >
      <p className="mg-preview-access__eyebrow">{eyebrow}</p>
      <h2 className="mg-preview-access__title" id="mg-preview-access-title-preview">
        {title}
      </h2>
      <p className="mg-preview-access__body" id="mg-preview-access-body-preview">
        {message}
      </p>
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
            aria-describedby="mg-preview-access-error-preview"
          />
          <button className="mg-preview-access__submit" type="submit">
            {submitLabel}
          </button>
        </div>
        <p
          className="mg-preview-access__error"
          id="mg-preview-access-error-preview"
          role="alert"
        />
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
  /** Small label above the title. */
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
