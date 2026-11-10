import React, { useEffect, useId, useRef } from 'react';
import { mgDialog, mgDialogDestroy } from '../../assets/js/dialog';
import { resolveLanguage } from '../../../.storybook/language';
import { DIALOG_STORY_CONTENT } from './Dialog.story-content';

function DialogExample({
  long = false,
  title,
  titleLang,
  titleDir,
  expandedClose = false,
  language,
}) {
  const copy = DIALOG_STORY_CONTENT[language.lang];
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const element = ref.current;
    mgDialog(element);
    return () => mgDialogDestroy(element);
  }, []);
  return (
    <div ref={ref} data-mg-dialog="" lang={language.lang} dir={language.dir}>
      <button
        type="button"
        className="mg-button mg-button-primary"
        data-mg-dialog-trigger=""
        hidden
      >
        {long ? copy.trigger : copy.shortTitle}
      </button>
      <details data-mg-dialog-fallback="">
        <summary>{long ? copy.trigger : copy.shortTitle}</summary>
        <div data-mg-dialog-content="">
          <header className="mg-dialog__header">
            <h2
              id={id}
              lang={titleLang}
              dir={titleDir}
              className="mg-dialog__title"
              data-mg-dialog-title=""
              data-mg-dialog-initial-focus=""
              tabIndex={-1}
            >
              {title || (long ? copy.longTitle : copy.shortTitle)}
            </h2>
            <button
              type="button"
              className="mg-button mg-button-secondary mg-dialog__close"
              data-mg-dialog-close=""
              hidden
            >
              {expandedClose ? copy.expandedClose : copy.close}
            </button>
          </header>
          <div className="mg-dialog__body mg-content">
            <p>{long ? copy.longBody : copy.shortBody}</p>
            {long &&
              Array.from({ length: 12 }, (_, index) => (
                <section key={index}>
                  <h3>
                    {copy.section} {index + 1}
                  </h3>
                  <p>{copy.paragraph}</p>
                </section>
              ))}
          </div>
        </div>
      </details>
    </div>
  );
}

const renderExample = (args, context) => {
  const language = resolveLanguage(context.globals);
  return (
    <DialogExample
      key={`${language.lang}-${language.dir}`}
      {...args}
      language={language}
    />
  );
};

export default {
  title: 'Components/Dialog',
  parameters: {
    docs: { source: { html: true }, story: { inline: false, height: '600px' } },
  },
  render: renderExample,
};
export const ShortMessage = { name: 'Short message' };
export const LongReading = { name: 'Long reading', args: { long: true } };

export const LongTitle = {
  name: 'Long title',
  args: {
    title: 'Katastrophenrisikomanagement und gemeinschaftliche Resilienz',
    titleLang: 'de',
    titleDir: 'ltr',
  },
};

// A distinct text-expansion stress condition, not a separate locale export.
export const ExpandedCloseLabel = {
  name: 'Expanded Close label',
  args: { long: true, expandedClose: true },
};
