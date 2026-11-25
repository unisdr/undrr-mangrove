import React, { useEffect, useState } from 'react';
import { CtaButton } from '../Components/Buttons/CtaButton/CtaButton';
import { TextInput } from '../Components/Forms/TextInput/TextInput';
import { Select } from '../Components/Forms/Select/Select';
import { Checkbox } from '../Components/Forms/Checkbox/Checkbox';
import { Tab } from '../Components/Tab/Tab';
import { VerticalCard } from '../Components/Cards/Card/VerticalCard';
import './delta-2027-review.scss';

const HAZARDS = [
  { value: 'flood', label: 'Flood' },
  { value: 'storm', label: 'Storm' },
  { value: 'drought', label: 'Drought' },
];
const TABS = [
  {
    text: 'Overview',
    text_id: 'delta-review-overview',
    data: '<p>Record the event, check the affected locations and prepare the entry for validation.</p>',
  },
  {
    text: 'Impact',
    text_id: 'delta-review-impact',
    data: '<p>Impact data can be added once the event details have been checked.</p>',
  },
  {
    text: 'Sources',
    text_id: 'delta-review-sources',
    data: '<p>Attach the published source and its date to each reported figure.</p>',
  },
];
const CARDS = [
  {
    title: 'Flooding in Central Province',
    label1: 'Event summary',
    summaryText:
      'Local authorities are checking the affected locations and reported impacts before publication.',
  },
];
const RECORDS = [
  ['DEL-0271', 'Central Province', 'published', 'Published'],
  [
    'DEL-0272',
    'Eastern District',
    'waiting-validation',
    'Waiting for validation',
  ],
  ['DEL-0273', 'Northern Region', 'draft', 'Draft'],
];

function ComponentGallery({ theme }) {
  const [message, setMessage] = useState(
    'Changes are stored only in this preview.'
  );
  const [override, setOverride] = useState(false);
  const [accent, setAccent] = useState('#7c3aed');
  const accentProperty =
    theme === 'Delta 2027 Theme'
      ? '--mg-semantic-action-default'
      : '--mg-color-interactive';

  useEffect(() => {
    if (!override) return undefined;
    const bodyStyle = document.body.style;
    const previousValue = bodyStyle.getPropertyValue(accentProperty);
    const previousPriority = bodyStyle.getPropertyPriority(accentProperty);
    const value =
      theme === 'Delta 2027 Theme'
        ? accent
        : [1, 3, 5]
            .map(start => parseInt(accent.slice(start, start + 2), 16))
            .join(', ');
    bodyStyle.setProperty(accentProperty, value);
    return () => {
      if (previousValue) {
        bodyStyle.setProperty(accentProperty, previousValue, previousPriority);
      } else {
        bodyStyle.removeProperty(accentProperty);
      }
    };
  }, [override, accent, accentProperty, theme]);

  return (
    <main className="mg-delta-review" lang="en">
      <header className="mg-delta-review__intro">
        <h1>Disaster event record</h1>
        <p>The same Mangrove components and content in each theme.</p>
      </header>

      <details className="mg-delta-review__override">
        <summary>Try a local token override</summary>
        <Checkbox
          label="Apply the preview token override"
          checked={override}
          onChange={event => setOverride(event.target.checked)}
        />
        <label className="mg-delta-review__colour">
          Preview accent
          <input
            type="color"
            value={accent}
            onChange={event => setAccent(event.target.value)}
          />
        </label>
        <p>
          This preview changes <code>{accentProperty}</code>. Other states
          retain their own tokens.
        </p>
      </details>

      <section
        className="mg-delta-review__section"
        aria-labelledby="review-actions"
      >
        <h2 id="review-actions">Actions and states</h2>
        <div className="mg-delta-review__actions">
          <button
            type="button"
            className="mg-button mg-button-primary"
            onClick={() => setMessage('Draft saved in this preview.')}
          >
            Save draft
          </button>
          <CtaButton
            label="View summary"
            Type="Secondary"
            Outline
            href="#review-summary"
          />
          <button
            type="button"
            className="mg-button mg-button-primary"
            disabled
          >
            Publish
          </button>
        </div>
        <p className="mg-delta-review__feedback" role="status">
          {message}
        </p>
      </section>

      <section
        className="mg-delta-review__section"
        aria-labelledby="review-fields"
      >
        <h2 id="review-fields">Fields</h2>
        <div className="mg-delta-review__fields">
          <TextInput
            label="Event name"
            defaultValue="Flooding in Central Province"
            helpText="Use the name from the published source."
          />
          <Select label="Hazard" options={HAZARDS} defaultValue="flood" />
          <TextInput
            label="Source URL"
            defaultValue="local report"
            error
            errorText="Enter a complete URL, including https://."
          />
          <TextInput
            label="Record identifier"
            defaultValue="DEL-0271"
            disabled
          />
          <Checkbox
            label="Include this record in the next validation round"
            defaultChecked
          />
        </div>
      </section>

      <section
        className="mg-delta-review__section"
        aria-labelledby="review-tabs"
      >
        <h2 id="review-tabs">Record sections</h2>
        <Tab
          tabdata={TABS}
          labels={{ tabListLabel: 'Event record sections' }}
        />
      </section>

      <section
        className="mg-delta-review__section"
        id="review-summary"
        aria-labelledby="review-card"
      >
        <h2 id="review-card">Summary card</h2>
        <VerticalCard data={CARDS} />
      </section>

      <section
        className="mg-delta-review__section"
        aria-labelledby="review-records"
      >
        <h2 id="review-records">Records and status</h2>
        <div
          className="mg-table-scroll-region"
          role="region"
          aria-label="Scrollable event records"
          tabIndex={0}
        >
          <table className="mg-table">
            <caption className="mg-u-sr-only">
              Event records awaiting review
            </caption>
            <thead>
              <tr>
                <th scope="col">Record</th>
                <th scope="col">Location</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {RECORDS.map(([id, location, modifier, status]) => (
                <tr key={id}>
                  <td>
                    <code>{id}</code>
                  </td>
                  <td>{location}</td>
                  <td>
                    <span
                      className={`mg-status-label mg-status-label--${modifier}`}
                    >
                      <span
                        className="mg-status-label__indicator"
                        aria-hidden="true"
                      />
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Table and status labels use the published HTML and CSS patterns.</p>
      </section>
    </main>
  );
}

// Each document loads its theme through the normal Storybook loader. Keeping
// stylesheets separate also exercises the shipped single-theme bundles.
function ThemeComparison({ direction = 'ltr' }) {
  const frames = [
    ['Existing Delta', 'DELTA Resilience Theme'],
    ['Delta 2027', 'Delta 2027 Theme'],
  ];
  return (
    <main className="mg-delta-comparison" lang="en">
      <header className="mg-delta-comparison__intro">
        <h1>Delta theme comparison</h1>
        <p>
          Identical components, two themes. Edit a field, save a draft or change
          a tab in either pane.
        </p>
        <p>
          Use the direction toolbar to compare right-to-left layouts. Open “Same
          components” for a single full-width canvas and the theme toolbar.
        </p>
      </header>
      <div className="mg-delta-comparison__panes">
        {frames.map(([label, theme]) => (
          <section
            key={theme}
            className="mg-delta-comparison__pane"
            aria-label={label}
          >
            <h2>{label}</h2>
            <iframe
              title={`${label}: interactive Mangrove component gallery`}
              src={`iframe.html?id=design-decisions-delta-2027--same-components&viewMode=story&globals=${encodeURIComponent(`theme:${theme};locale:english;addonRtl:${direction}`)}`}
              loading="eager"
            />
          </section>
        ))}
      </div>
    </main>
  );
}

export default {
  title: 'Design decisions/Delta 2027',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Review the additive Delta 2027 theme against the existing Delta theme. This uses existing Mangrove components; it does not merge the separate React Aria ComboBox pilot.',
      },
    },
  },
  tags: ['!autodocs'],
};

export const CompareThemes = {
  name: 'Compare themes',
  render: (_args, { globals }) => (
    <ThemeComparison
      direction={
        globals.addonRtl === 'rtl' || globals.locale === 'arabic'
          ? 'rtl'
          : 'ltr'
      }
    />
  ),
};

export const SameComponents = {
  name: 'Same components',
  render: (_args, { globals }) => <ComponentGallery theme={globals.theme} />,
};
