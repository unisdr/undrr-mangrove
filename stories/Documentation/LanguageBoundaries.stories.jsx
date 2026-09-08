/**
 * @file LanguageBoundaries.stories.jsx
 * @description Integration demo for Mangrove's Arabic `:lang(ar)` typography
 * rules at a nested language boundary.
 *
 * These stories are a deliberate exception to the "no story per language"
 * rule in CONTRIBUTING.md. The locale toolbar sets a single `lang` on the
 * `<html>` element, so it can render a page as Arabic or as English but never
 * as both at once. A language boundary only exists when two languages are on
 * the page simultaneously, which is the condition these rules govern, so the
 * toolbar cannot demonstrate it by construction. Each specimen declares its own
 * `lang` on a subtree and therefore reads correctly whichever locale the
 * toolbar is set to.
 *
 * See unisdr/undrr-mangrove#1092.
 */

import React from 'react';
import { LanguageBoundaryDemo } from './components/LanguageBoundaryDemo';

const ARABIC_HEADING = 'الحد من مخاطر الكوارث';
const ARABIC_BODY =
  'يعمل المكتب على الحد من مخاطر الكوارث وبناء قدرة المجتمعات على الصمود.';

export default {
  title: 'Design decisions/Language boundaries',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'How Arabic typography behaves when Arabic and Latin content are nested inside one another. Every font family shown is read back from the rendered page, and the expected values come from the live reference samples at the top of each specimen rather than from a written-down list.',
      },
    },
  },
  decorators: [
    (Story, context) => (
      <Story
        args={{
          ...context.args,
          remeasureKey: `${context.globals.theme}|${context.globals.locale}`,
        }}
      />
    ),
  ],
};

/**
 * The primary case: an Arabic page containing an English island, with Arabic
 * resuming inside it.
 */
export const ArabicPageWithLatinIsland = {
  name: 'Arabic page with a Latin island',
  render: args => (
    <LanguageBoundaryDemo
      heading="Arabic page with a Latin island"
      intro="An untranslated widget, a citation, or a partner name inside an Arabic page. Arabic typography stops at the island and picks up again inside it. Bordered blocks are the elements that declare a lang attribute."
      lang="ar"
      dir="rtl"
      remeasureKey={args.remeasureKey}
    >
      <h1 data-expect="arabicHeading">{ARABIC_HEADING}</h1>
      <p data-expect="arabicBody">{ARABIC_BODY}</p>
      <div className="mg-card">
        <header className="mg-card__title" data-expect="arabicHeading">
          {ARABIC_HEADING}
        </header>
      </div>

      <div lang="en" dir="ltr" data-expect="latinBody">
        <h1 data-expect="latinBody">Words into action guidelines</h1>
        <p data-expect="latinBody">
          An English paragraph inside an Arabic page. Before this fix it
          rendered in the Arabic body face.
        </p>
        <button type="button" data-expect="latinBody">
          Download the report
        </button>
        <p>
          <span className="mg-tag" data-expect="latinChrome">
            Early warning
          </span>
        </p>
        <div className="mg-card">
          <header className="mg-card__title" data-expect="latinChrome">
            Card title keeps its condensed face
            <a href="#card-example" data-expect="latinChrome">
              and so does the link inside it
            </a>
          </header>
        </div>

        <div lang="ar" dir="rtl" data-expect="arabicBody">
          <h2 data-expect="arabicHeading">{ARABIC_HEADING}</h2>
          <p data-expect="arabicBody">{ARABIC_BODY}</p>
        </div>

        <p
          lang=""
          data-expect="latinBody"
          data-note='lang="" means unknown, not Latin, so it inherits from the island rather than being forced.'
        >
          An element with an empty lang attribute inherits.
        </p>
      </div>

      <p
        lang=""
        data-expect="arabicBody"
        data-note="The same empty lang attribute back on the Arabic side inherits Arabic. Nothing is guessed."
      >
        {ARABIC_BODY}
      </p>
    </LanguageBoundaryDemo>
  ),
};

/**
 * The mirror case, handled by the second boundary rule: an Arabic island on an
 * otherwise Latin page.
 */
export const LatinPageWithArabicIsland = {
  name: 'Latin page with an Arabic island',
  render: args => (
    <LanguageBoundaryDemo
      heading="Latin page with an Arabic island"
      intro="A quotation or a translated summary inside an English page. Roboto has no Arabic coverage, so the Arabic family has to be restored at the switch point or the browser falls back to a system face."
      lang="en"
      dir="ltr"
      remeasureKey={args.remeasureKey}
    >
      <h1 data-expect="latinBody">Global assessment report</h1>
      <p data-expect="latinBody">
        An English page. The block below is an Arabic quotation.
      </p>

      <div lang="ar" dir="rtl" data-expect="arabicBody">
        <h2 data-expect="arabicHeading">{ARABIC_HEADING}</h2>
        <p data-expect="arabicBody">{ARABIC_BODY}</p>
        <p>
          <span className="mg-tag" data-expect="arabicHeading">
            {ARABIC_HEADING}
          </span>
        </p>
      </div>

      <p data-expect="latinBody">English resumes after the quotation.</p>
    </LanguageBoundaryDemo>
  ),
};

/**
 * The sharp edge. The boundary rules reassert one family, so a language switch
 * on a generic element inside component chrome falls back to the base body
 * face instead of the component's own face.
 */
export const InsideComponentChrome = {
  name: 'Switching language inside component chrome',
  render: args => (
    <LanguageBoundaryDemo
      heading="Switching language inside component chrome"
      intro="A known limitation, shown rather than hidden. The boundary rules can only reassert one family, and they reassert the base body face. Put the lang attribute on the element that carries the component class and the component rule wins instead, because the boundary rules have zero specificity."
      lang="ar"
      dir="rtl"
      remeasureKey={args.remeasureKey}
    >
      <div className="mg-card">
        <header className="mg-card__title" data-expect="arabicHeading">
          {ARABIC_HEADING}{' '}
          <a
            href="#chrome-example"
            lang="en"
            dir="ltr"
            data-expect="latinBody"
            data-note="Known limitation: ideally Roboto Condensed, to match the Latin card title. The boundary rule reasserts the base body face because CSS cannot know which component face applied above the switch point."
          >
            Sendai Framework
          </a>
        </header>
      </div>

      <div className="mg-card">
        <header
          className="mg-card__title"
          lang="en"
          dir="ltr"
          data-expect="latinChrome"
          data-note="The workaround: put lang on the element carrying the component class. The boundary rules are wrapped in :where(), so the component rule wins."
        >
          Sendai Framework for disaster risk reduction
        </header>
      </div>

      <h2 lang="en" dir="ltr" data-expect="latinBody">
        A heading at the switch point resolves normally, because Latin headings
        inherit the body face anyway.
      </h2>
    </LanguageBoundaryDemo>
  ),
};
