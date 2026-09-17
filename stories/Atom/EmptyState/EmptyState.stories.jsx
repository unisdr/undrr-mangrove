import React from 'react';

export default {
  title: 'Components/Empty state',
  parameters: {
    docs: {
      description: {
        component:
          'What a list, table, chart or dashboard tile shows when it has nothing to show. ' +
          'A heading, an explanation, an optional glyph, and an optional action slot. ' +
          'CSS only — no JavaScript, no React component.',
      },
    },
  },
};

/**
 * Decorative "empty tray" glyph. Drawn with currentColor so it inherits
 * --mg-empty-state-media-color and re-themes with the rest of the component.
 */
const TrayGlyph = () => (
  <svg
    viewBox="0 0 56 44"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M8 18 14 4h28l6 14" />
    <path d="M8 18h12l3 6h10l3-6h12v18a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" />
  </svg>
);

export const Default = {
  render: () => (
    <div className="mg-empty-state">
      <div className="mg-empty-state__media">
        <TrayGlyph />
      </div>
      <h2 className="mg-empty-state__title">No records yet</h2>
      <p className="mg-empty-state__description">
        Records you add or import will appear here. You can start with a single
        record or import a spreadsheet.
      </p>
      <div className="mg-empty-state__actions">
        <a href="#" className="mg-button mg-button-primary">
          Add a record
        </a>
        <a href="#" className="mg-button mg-button-primary mg-button-outline">
          Import data
        </a>
      </div>
    </div>
  ),
};

export const NoAction = {
  render: () => (
    <div className="mg-empty-state">
      <div className="mg-empty-state__media">
        <TrayGlyph />
      </div>
      <h2 className="mg-empty-state__title">No results found</h2>
      <p className="mg-empty-state__description">
        No records match the filters you have applied. Try removing a filter or
        widening the date range.
      </p>
    </div>
  ),
  name: 'Without an action',
};

export const Panel = {
  render: () => (
    <div
      className="mg-empty-state mg-empty-state--panel"
      style={{ maxWidth: '480px' }}
    >
      <div className="mg-empty-state__media">
        <TrayGlyph />
      </div>
      <h2 className="mg-empty-state__title">Nothing to chart yet</h2>
      <p className="mg-empty-state__description">
        This chart appears once economic loss figures have been recorded for the
        selected sector.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The `--panel` modifier puts the empty state on a tinted well, for a ' +
          'dashboard tile or a chart with no series.',
      },
    },
  },
};

export const Compact = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      {['Records', 'Tertiary affected', 'Damage'].map(label => (
        <div key={label} style={{ inlineSize: '200px' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{label}</p>
          <div className="mg-empty-state mg-empty-state--compact mg-empty-state--panel">
            <div className="mg-empty-state__media">
              <TrayGlyph />
            </div>
            <p className="mg-empty-state__description">No data</p>
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Indicator tiles and small chart wells, where the message is a bare ' +
          '"No data" and there is no room for a heading.',
      },
    },
  },
};

export const InATable = {
  render: () => (
    <table className="mg-table" style={{ inlineSize: '100%' }}>
      <caption className="mg-u-sr-only">Disaster records</caption>
      <thead>
        <tr>
          <th scope="col">Record</th>
          <th scope="col">Updated</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="mg-empty-state-cell" colSpan={3}>
            <div className="mg-empty-state" role="status">
              <div className="mg-empty-state__media">
                <TrayGlyph />
              </div>
              <p className="mg-empty-state__title">
                No records match your filters
              </p>
              <p className="mg-empty-state__description">
                Clear the country filter to see all 1,204 records.
              </p>
              <div className="mg-empty-state__actions">
                <button type="button" className="mg-button mg-button-primary">
                  Clear filters
                </button>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  ),
  name: 'In a table',
  parameters: {
    docs: {
      description: {
        story:
          'The empty state sits in a `<td colSpan>` so the table keeps a valid ' +
          'row and the column headers still apply. `role="status"` announces the ' +
          'change when the rows disappear in response to a filter.',
      },
    },
  },
};

export const HeadingLevel = {
  render: () => (
    <div>
      <h2>Recent disaster records</h2>
      <div className="mg-empty-state mg-empty-state--panel">
        <div className="mg-empty-state__media">
          <TrayGlyph />
        </div>
        <h3 className="mg-empty-state__title">No records this month</h3>
        <p className="mg-empty-state__description">
          Records published in the last 30 days will appear here.
        </p>
      </div>
    </div>
  ),
  name: 'Heading level',
  parameters: {
    docs: {
      description: {
        story:
          'The empty state sits under the section heading, so its title is an ' +
          '`<h3>`. `__title` is a class, not a tag: pick the level one below the ' +
          'heading of the section or card that contains it.',
      },
    },
  },
};

export const StartAligned = {
  render: () => (
    <div className="mg-empty-state mg-empty-state--start">
      <h2 className="mg-empty-state__title">No saved searches</h2>
      <p className="mg-empty-state__description">
        Save a search from the results page and it will be listed here.
      </p>
      <div className="mg-empty-state__actions">
        <a href="#" className="mg-button mg-button-primary">
          Browse records
        </a>
      </div>
    </div>
  ),
  name: 'Start aligned',
};

export const RightToLeft = {
  render: () => (
    <div dir="rtl" lang="ar">
      <div className="mg-empty-state mg-empty-state--start mg-empty-state--panel">
        <div className="mg-empty-state__media">
          <TrayGlyph />
        </div>
        <h2 className="mg-empty-state__title">لا توجد سجلات بعد</h2>
        <p className="mg-empty-state__description">
          ستظهر السجلات التي تضيفها أو تستوردها هنا.
        </p>
        <div className="mg-empty-state__actions">
          <a href="#" className="mg-button mg-button-primary">
            إضافة سجل
          </a>
        </div>
      </div>
    </div>
  ),
  name: 'Right to left',
};
