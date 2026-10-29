import React, { useEffect, useId, useRef } from 'react';
import { mgDialog, mgDialogDestroy } from '../../assets/js/dialog';

function DialogExample({ long = false, title }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const element = ref.current;
    mgDialog(element);
    return () => mgDialogDestroy(element);
  }, []);
  return (
    <div ref={ref} data-mg-dialog="">
      <button
        type="button"
        className="mg-button mg-button-primary"
        data-mg-dialog-trigger=""
        hidden
      >
        {long ? 'Read the case study' : 'Resource availability'}
      </button>
      <details data-mg-dialog-fallback="">
        <summary>
          {long ? 'Read the case study' : 'Resource availability'}
        </summary>
        <div data-mg-dialog-content="">
          <header className="mg-dialog__header">
            <h2
              id={id}
              className="mg-dialog__title"
              data-mg-dialog-title=""
              data-mg-dialog-initial-focus=""
              tabIndex={-1}
            >
              {title ||
                (long
                  ? 'Community resilience case study'
                  : 'Resource availability')}
            </h2>
            <button
              type="button"
              className="mg-button mg-button-secondary mg-dialog__close"
              data-mg-dialog-close=""
              hidden
            >
              Close
            </button>
          </header>
          <div className="mg-dialog__body mg-content">
            <p>
              {long
                ? 'Communities lead local risk reduction by combining local knowledge with accessible public services.'
                : 'The report will be available after publication. Return to this page for the download.'}
            </p>
            {long &&
              Array.from({ length: 12 }, (_, index) => (
                <section key={index}>
                  <h3>Local action {index + 1}</h3>
                  <p>
                    Residents and local authorities identify priorities
                    together, protect livelihoods and evaluate progress.
                    Inclusive planning gives people with disabilities and older
                    people a voice in decisions.
                  </p>
                </section>
              ))}
          </div>
        </div>
      </details>
    </div>
  );
}

export default {
  title: 'Components/Dialog',
  parameters: { docs: { story: { inline: false, height: '600px' } } },
};
export const ShortMessage = { render: () => <DialogExample /> };
export const LongReading = { render: () => <DialogExample long /> };

export const LongTitle = {
  render: () => (
    <DialogExample title="Katastrophenrisikomanagement und gemeinschaftliche Resilienz" />
  ),
};
