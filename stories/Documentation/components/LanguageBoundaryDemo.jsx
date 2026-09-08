/**
 * @file LanguageBoundaryDemo.jsx
 * @description Renders a nested multi-language specimen and reports the
 * font family the library's own cascade resolves to for each marked element.
 *
 * Why this measures instead of labelling: a hardcoded "should be Roboto"
 * caption still reads as correct after the CSS regresses, which is exactly the
 * failure this demo exists to catch. Every value shown here is read back from
 * `getComputedStyle` at runtime, and the expected values are themselves read
 * from reference elements rendered in the legend rather than written down. If
 * the Latin or Arabic tokens are ever remapped, the demo follows them instead
 * of going stale.
 *
 * See unisdr/undrr-mangrove#1092.
 */

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './language-boundary-demo.css';

/**
 * The four families the library resolves to, each derived from a live
 * reference element rather than a literal. `data-ref` marks the element whose
 * computed family defines the reference.
 */
const REFERENCE_KEYS = [
  'latinBody',
  'latinChrome',
  'arabicBody',
  'arabicHeading',
];

/** Human-readable names for the reference keys used in the results table. */
const REFERENCE_LABELS = {
  latinBody: 'Latin body',
  latinChrome: 'Latin component chrome',
  arabicBody: 'Arabic body',
  arabicHeading: 'Arabic heading',
};

/**
 * Normalises a computed `font-family` list so two spellings of the same stack
 * compare equal. Browsers quote family names inconsistently.
 */
function normaliseFamily(value) {
  return (value || '')
    .replace(/["']/g, '')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

/** The first family in a computed stack, for compact display. */
function primaryFamily(value) {
  return normaliseFamily(value).split(', ')[0] || '(none)';
}

/**
 * A short CSS-ish descriptor for an element, derived from the DOM so it cannot
 * drift from the markup: `header.mg-card__title[lang="en"]`.
 */
function describe(element) {
  const tag = element.tagName.toLowerCase();
  const classes = element.classList.length
    ? `.${Array.from(element.classList).join('.')}`
    : '';
  const lang = element.getAttribute('lang');
  const langPart = lang === null ? '' : `[lang="${lang}"]`;
  return `${tag}${classes}${langPart}`;
}

/** How many ancestors sit between `element` and the specimen root. */
function depthWithin(element, stage) {
  let depth = 0;
  let node = element.parentElement;
  while (node && node !== stage) {
    depth += 1;
    node = node.parentElement;
  }
  return depth;
}

/**
 * A nested-language specimen with a live font-family readout.
 *
 * Mark any element inside `children` with `data-expect="<reference key>"` to
 * add it to the readout. Add `data-note="..."` to annotate a row.
 *
 * @param {object} props Component props.
 * @param {string} props.heading Short title for the specimen.
 * @param {React.ReactNode} props.intro Prose shown above the specimen.
 * @param {string} props.lang Language of the specimen root.
 * @param {string} props.dir Text direction of the specimen root.
 * @param {string} props.remeasureKey Changing this re-runs the measurement,
 *   so the readout follows the Storybook theme and locale toolbars.
 * @param {React.ReactNode} props.children The specimen markup.
 */
export function LanguageBoundaryDemo({
  heading,
  intro = null,
  lang,
  dir,
  remeasureKey = '',
  children,
}) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const [references, setReferences] = useState({});
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const measuredReferences = {};
    REFERENCE_KEYS.forEach(key => {
      const element = root.querySelector(`[data-ref="${key}"]`);
      if (element) {
        measuredReferences[key] = normaliseFamily(
          window.getComputedStyle(element).fontFamily
        );
      }
    });

    const measuredRows = Array.from(
      stage.querySelectorAll('[data-expect]')
    ).map((element, index) => {
      const expectedKey = element.getAttribute('data-expect');
      const expected = measuredReferences[expectedKey];
      const actual = normaliseFamily(
        window.getComputedStyle(element).fontFamily
      );
      return {
        key: `${index}-${describe(element)}`,
        descriptor: describe(element),
        depth: depthWithin(element, stage),
        expectedKey,
        expected,
        actual,
        matches: expected === actual,
        note: element.getAttribute('data-note') || '',
      };
    });

    setReferences(measuredReferences);
    setRows(measuredRows);
  }, [remeasureKey]);

  const mismatches = rows.filter(row => !row.matches);

  return (
    <section className="mg-lang-demo" lang="en" dir="ltr" ref={rootRef}>
      <h3 className="mg-lang-demo__heading">{heading}</h3>
      {intro ? <p className="mg-lang-demo__intro">{intro}</p> : null}

      <div className="mg-lang-demo__legend">
        <div className="mg-lang-demo__legend-item">
          <p className="mg-lang-demo__legend-sample" data-ref="latinBody">
            Disaster risk reduction
          </p>
          <span className="mg-lang-demo__legend-name">
            {REFERENCE_LABELS.latinBody}:{' '}
            {primaryFamily(references.latinBody) || '...'}
          </span>
        </div>
        <div className="mg-lang-demo__legend-item">
          <div className="mg-card">
            <header
              className="mg-card__title mg-lang-demo__legend-sample"
              data-ref="latinChrome"
            >
              Disaster risk reduction
            </header>
          </div>
          <span className="mg-lang-demo__legend-name">
            {REFERENCE_LABELS.latinChrome}:{' '}
            {primaryFamily(references.latinChrome) || '...'}
          </span>
        </div>
        <div className="mg-lang-demo__legend-item">
          <p
            className="mg-lang-demo__legend-sample"
            lang="ar"
            dir="rtl"
            data-ref="arabicBody"
          >
            الحد من مخاطر الكوارث
          </p>
          <span className="mg-lang-demo__legend-name">
            {REFERENCE_LABELS.arabicBody}:{' '}
            {primaryFamily(references.arabicBody) || '...'}
          </span>
        </div>
        <div className="mg-lang-demo__legend-item">
          <h2
            className="mg-lang-demo__legend-sample"
            lang="ar"
            dir="rtl"
            data-ref="arabicHeading"
          >
            الحد من مخاطر الكوارث
          </h2>
          <span className="mg-lang-demo__legend-name">
            {REFERENCE_LABELS.arabicHeading}:{' '}
            {primaryFamily(references.arabicHeading) || '...'}
          </span>
        </div>
      </div>

      <div className="mg-lang-demo__stage" lang={lang} dir={dir} ref={stageRef}>
        {children}
      </div>

      <table className="mg-lang-demo__table">
        <caption className="mg-lang-demo__intro">
          Font family resolved for each marked element, read from the rendered
          page. Indentation shows nesting inside the specimen.
        </caption>
        <thead>
          <tr>
            <th scope="col">Element</th>
            <th scope="col">Expected</th>
            <th scope="col">Resolved</th>
            <th scope="col">Result</th>
            <th scope="col">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key}>
              <td className="mg-lang-demo__element">
                <code style={{ marginInlineStart: `${row.depth}rem` }}>
                  {row.descriptor}
                </code>
              </td>
              <td>
                {REFERENCE_LABELS[row.expectedKey]} (
                {primaryFamily(row.expected)})
              </td>
              <td>{primaryFamily(row.actual)}</td>
              <td
                className={
                  row.matches
                    ? 'mg-lang-demo__status'
                    : 'mg-lang-demo__status mg-lang-demo__status--mismatch'
                }
              >
                {row.matches ? 'Matches' : 'Does not match'}
              </td>
              <td className="mg-lang-demo__note">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mg-lang-demo__summary">
        {rows.length === 0
          ? 'Measuring...'
          : `${rows.length - mismatches.length} of ${rows.length} elements resolved to the expected family.`}
      </p>
    </section>
  );
}

LanguageBoundaryDemo.propTypes = {
  /** Short title for the specimen. */
  heading: PropTypes.string.isRequired,
  /** Prose shown above the specimen. */
  intro: PropTypes.node,
  /** Language of the specimen root, e.g. `ar`. */
  lang: PropTypes.string.isRequired,
  /** Text direction of the specimen root, e.g. `rtl`. */
  dir: PropTypes.string.isRequired,
  /** Changing this re-runs the measurement. */
  remeasureKey: PropTypes.string,
  /** The specimen markup. */
  children: PropTypes.node.isRequired,
};

export default LanguageBoundaryDemo;
