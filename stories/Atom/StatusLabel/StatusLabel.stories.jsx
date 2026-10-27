import React from 'react';

export default {
  title: 'Components/Status label',
  parameters: {
    docs: {
      // CSS only: "Show code" shows the rendered HTML.
      source: { html: true },
      description: {
        component:
          'A workflow status shown as a coloured indicator followed by the status name. ' +
          'The four modifiers cover the DELTA/DLDTS record and event workflow ' +
          '(draft, waiting for validation, waiting for more information, published). ' +
          'Two service health modifiers (warning, negative) cover degraded and offline ' +
          'services. The base class on its own gives a neutral indicator for any other status. ' +
          'Each status has its own shape as well as its own colour. ' +
          'CSS only — no JavaScript, no React component.',
      },
    },
  },
};

/** The DELTA record workflow, in the order the board lists it. */
const STATUSES = [
  { modifier: 'draft', label: 'Draft' },
  { modifier: 'waiting-information', label: 'Waiting for more information' },
  { modifier: 'waiting-validation', label: 'Waiting for validation' },
  { modifier: 'published', label: 'Published' },
];

const Label = ({ modifier, label }) => (
  <span
    className={
      modifier
        ? `mg-status-label mg-status-label--${modifier}`
        : 'mg-status-label'
    }
  >
    <span className="mg-status-label__indicator" />
    {label}
  </span>
);

export const Default = {
  render: () => <Label modifier="published" label="Published" />,
};

export const AllStatuses = {
  render: () => (
    <ul className="mg-status-label-group">
      {STATUSES.map(status => (
        <li key={status.modifier}>
          <Label {...status} />
        </li>
      ))}
    </ul>
  ),
  name: 'All statuses',
};

export const Neutral = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Label label="Archived" />
      <Label label="Under review" />
    </div>
  ),
  name: 'Neutral (no modifier)',
  parameters: {
    docs: {
      description: {
        story:
          'Without a status modifier the indicator is neutral grey. Use this for ' +
          'states outside the DELTA workflow rather than borrowing a colour that ' +
          'already means something else.',
      },
    },
  },
};

export const ServiceHealth = {
  render: () => (
    <ul className="mg-status-label-group">
      <li>
        <Label modifier="warning" label="Degraded" />
      </li>
      <li>
        <Label modifier="negative" label="Offline" />
      </li>
    </ul>
  ),
  name: 'Service health',
  parameters: {
    docs: {
      description: {
        story:
          'The `--warning` and `--negative` modifiers show the health of a ' +
          'service or system. ServiceNotice uses them for its degraded and ' +
          'offline badges; use them wherever else a service state needs showing.',
      },
    },
  },
};

export const InATable = {
  render: () => (
    <table className="mg-table" style={{ inlineSize: '100%' }}>
      <caption className="mg-u-sr-only">
        Disaster records and their status
      </caption>
      <thead>
        <tr>
          <th scope="col">Record</th>
          <th scope="col">Updated</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Flooding, Central Province</td>
          <td>12 May 2026</td>
          <td>
            <Label modifier="published" label="Published" />
          </td>
        </tr>
        <tr>
          <td>Landslide, Eastern District</td>
          <td>9 May 2026</td>
          <td>
            <Label
              modifier="waiting-validation"
              label="Waiting for validation"
            />
          </td>
        </tr>
        <tr>
          <td>Drought, Northern Region</td>
          <td>3 May 2026</td>
          <td>
            <Label
              modifier="waiting-information"
              label="Waiting for more information"
            />
          </td>
        </tr>
        <tr>
          <td>Storm surge, Coastal Zone</td>
          <td>28 April 2026</td>
          <td>
            <Label modifier="draft" label="Draft" />
          </td>
        </tr>
      </tbody>
    </table>
  ),
  name: 'In a table',
};

/** Enough rows that the reader scans the indicators rather than reading them. */
const DENSE_RECORDS = [
  ['Flooding, Central Province', 'published', 'Published'],
  [
    'Landslide, Eastern District',
    'waiting-validation',
    'Waiting for validation',
  ],
  [
    'Drought, Northern Region',
    'waiting-information',
    'Waiting for more information',
  ],
  ['Storm surge, Coastal Zone', 'draft', 'Draft'],
  ['Wildfire, Southern Hills', 'published', 'Published'],
  [
    'Earthquake, Rift Valley',
    'waiting-information',
    'Waiting for more information',
  ],
  ['Heatwave, Inland Plateau', 'waiting-validation', 'Waiting for validation'],
  ['Cyclone, Island Group', 'published', 'Published'],
  ['Epidemic, Border Districts', 'draft', 'Draft'],
  ['Locust swarm, Dry Belt', 'waiting-validation', 'Waiting for validation'],
  ['Tsunami, Eastern Seaboard', 'published', 'Published'],
  [
    'Avalanche, High Passes',
    'waiting-information',
    'Waiting for more information',
  ],
];

export const DenseList = {
  render: () => (
    <ul
      className="mg-status-label-group"
      style={{ flexDirection: 'column', gap: '4px' }}
    >
      {DENSE_RECORDS.map(([record, modifier, label]) => (
        <li key={record} style={{ display: 'flex', gap: '12px' }}>
          <Label modifier={modifier} label={label} />
          <span>{record}</span>
        </li>
      ))}
    </ul>
  ),
  name: 'In a dense list',
  parameters: {
    docs: {
      description: {
        story:
          'Scanning a long list is where a second cue earns its place. Each ' +
          'status has a shape as well as a colour, so a reader who cannot ' +
          'separate the pale yellow from the olive, or the gold from the red, ' +
          'still sees four different marks.',
      },
    },
  },
};

export const RightToLeft = {
  render: () => (
    <div dir="rtl" lang="ar">
      <ul className="mg-status-label-group">
        <li>
          <Label modifier="published" label="منشور" />
        </li>
        <li>
          <Label modifier="draft" label="مسودة" />
        </li>
        <li>
          <Label modifier="waiting-validation" label="في انتظار التحقق" />
        </li>
      </ul>
    </div>
  ),
  name: 'Right to left',
};
