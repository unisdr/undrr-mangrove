import React, { useState } from 'react';
import { expect, within } from 'storybook/test';
import { TableTag } from './Table';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        headertext: 'Table header',
        tdtext: 'Content Goes Here',
        details:
          'In publishing and graphic design, dummy is a placeholder text commonly used to demonstrate',
      };
      return engText;
    case 'arabic':
      const arabicText = {
        headertext: 'رأس الجدول',
        tdtext: 'المحتوى يذهب هنا',
        details:
          'في النشر والتصميم الجرافيكي ، الدمية هي عنصر نائب يستخدم عادة للتوضيح',
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        headertext: 'テーブルヘッダー',
        tdtext: 'コンテンツはここにあります',
        details:
          '出版やグラフィックデザインでは、ダミーはデモンストレーションに一般的に使用されるプレースホルダーテキストです',
      };
      return japaneseText;
    default:
      return {
        headertext: 'Table header',
        tdtext: 'Content Goes Here',
        details:
          'In publishing and graphic design, dummy is a placeholder text commonly used to demonstrate',
      };
  }
};

export default {
  title: 'Components/Table',
  component: TableTag,

  argTypes: {
    size: {
      options: ['large', 'small'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'large',
    },

    variant: {
      options: ['default', 'striped', 'border'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'default',
    },

    responsive: {
      options: ['stacked', 'auto', 'scroll'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'auto',
    },
  },
};

export const DefaultTable = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <TableTag
        text={caption.headertext}
        tdtext={caption.tdtext}
        details={caption.details}
        {...args}
      ></TableTag>
    );
  },
  name: 'Default table',
};

export const StripedTable = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <TableTag
        text={caption.headertext}
        tdtext={caption.tdtext}
        details={caption.details}
        variant="striped"
        {...args}
      ></TableTag>
    );
  },

  name: 'Striped table',
};

export const BorderedTable = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <TableTag
        text={caption.headertext}
        tdtext={caption.tdtext}
        details={caption.details}
        variant="border"
        {...args}
      ></TableTag>
    );
  },

  name: 'Bordered table',
};

export const SmallTable = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <TableTag
        text={caption.headertext}
        tdtext={caption.tdtext}
        details={caption.details}
        size="small"
        {...args}
      ></TableTag>
    );
  },

  name: 'Small table',
};

export const SmallStripedTable = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <TableTag
        text={caption.headertext}
        tdtext={caption.tdtext}
        details={caption.details}
        size="small"
        variant="striped"
        {...args}
      ></TableTag>
    );
  },

  name: 'Small striped table',
};

export const StackedTable = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <TableTag
        text={caption.headertext}
        tdtext={caption.tdtext}
        details={caption.details}
        responsive="stacked"
        {...args}
      ></TableTag>
    );
  },

  name: 'Stacked table (mobile-first)',
};

export const ScrollableTable = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <TableTag
        text={caption.headertext}
        tdtext={caption.tdtext}
        details={caption.details}
        responsive="scroll"
        {...args}
      ></TableTag>
    );
  },

  name: 'Scrollable table',
};

export const BorderedStackedTable = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <TableTag
        text={caption.headertext}
        tdtext={caption.tdtext}
        details={caption.details}
        variant="border"
        responsive="stacked"
        {...args}
      ></TableTag>
    );
  },

  name: 'Bordered stacked table',
};

export const ColumnAlignment = {
  render: () => (
    <table className="mg-table mg-table--striped">
      <thead>
        <tr>
          <th scope="col">Region</th>
          <th className="mg-table__cell--center" scope="col">
            Status
          </th>
          <th className="mg-table__cell--end" scope="col">
            Reports
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Africa</th>
          <td className="mg-table__cell--center">On track</td>
          <td className="mg-table__cell--end">18</td>
        </tr>
        <tr>
          <th scope="row">Asia-Pacific</th>
          <td className="mg-table__cell--center">Review</td>
          <td className="mg-table__cell--end">24</td>
        </tr>
      </tbody>
    </table>
  ),
  name: 'Column alignment',
};

export const NarrowScroll = {
  name: 'Narrow scroll region',
  render: () => (
    <div style={{ width: '280px', maxWidth: '100%' }}>
      <TableTag
        responsive="scroll"
        scrollLabel="Disaster records"
        text="Country and region"
        tdtext="Democratic Republic of the Congo"
        details="A long description of disaster risk reduction measures"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', {
      name: 'Disaster records',
    });
    expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    expect(region.getBoundingClientRect().width).toBeLessThanOrEqual(280);
    expect(region).toHaveAttribute('tabindex', '0');
  },
};

export const DataTable = {
  name: 'Data table',
  render: () => {
    const [sortAsc, setSortAsc] = useState(true);
    const rows = [
      {
        name: 'style.min.css',
        type: 'CSS',
        size: '42.8 KB',
        status: 'Published',
      },
      {
        name: 'tokens.json',
        type: 'JSON',
        size: '18.2 KB',
        status: 'Published',
      },
      {
        name: 'releases.json',
        type: 'JSON',
        size: '64.5 KB',
        status: 'Published',
      },
      { name: 'index.json', type: 'JSON', size: '128.4 KB', status: 'Draft' },
      { name: 'bundle.js', type: 'JS', size: '256.0 KB', status: 'Published' },
    ];
    const sorted = [...rows].sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

    return (
      <div
        className="mg-table-scroll-region"
        role="region"
        aria-label="Asset listing"
        tabIndex="0"
        style={{ maxHeight: '260px', overflow: 'auto' }}
      >
        <table className="mg-table mg-table--data">
          <thead>
            <tr>
              <th
                className="mg-table__th--sticky mg-table__th--sortable"
                aria-sort={sortAsc ? 'ascending' : 'descending'}
                scope="col"
              >
                <button
                  type="button"
                  className="mg-table__sort-btn"
                  onClick={() => setSortAsc(!sortAsc)}
                >
                  <span>Filename</span>
                  <span className="mg-table__sort-icon" aria-hidden="true">
                    ▼
                  </span>
                </button>
              </th>
              <th className="mg-table__th--sticky" scope="col">
                Type
              </th>
              <th
                className="mg-table__th--sticky mg-table__th--numeric"
                scope="col"
              >
                Size
              </th>
              <th className="mg-table__th--sticky" scope="col">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.name}>
                <td className="mg-table__td--code">{row.name}</td>
                <td>
                  <span className="mg-badge mg-badge--code">{row.type}</span>
                </td>
                <td className="mg-table__td--numeric">{row.size}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector('table');
    const originalClass = table.className;
    const reference = document.createElement('span');
    reference.hidden = true;
    canvasElement.append(reference);
    const size = scale => {
      reference.style.fontSize = `var(--mg-font-size-${scale})`;
      return getComputedStyle(reference).fontSize;
    };

    // Exercise the existing data markup under every supported density, then
    // restore the consumer-facing example before screenshots or further use.
    try {
      for (const modifier of [
        '',
        'mg-table--small',
        'mg-table--data',
        'mg-table--small mg-table--data',
      ]) {
        table.className = `mg-table ${modifier}`;
        const compact = modifier !== '';
        expect(
          getComputedStyle(
            table.querySelector('tbody td:not(.mg-table__td--code)')
          ).fontSize
        ).toBe(size(compact ? '250' : '300'));
        expect(
          getComputedStyle(table.querySelector('.mg-table__td--code')).fontSize
        ).toBe(size('200'));
        expect(getComputedStyle(table.querySelector('th')).fontSize).toBe(
          size(
            modifier.includes('mg-table--data')
              ? '200'
              : compact
                ? '250'
                : '300'
          )
        );
        for (const cell of table.querySelectorAll(
          '.mg-table__td--numeric, .mg-table__th--numeric'
        )) {
          expect(getComputedStyle(cell).textAlign).toBe('end');
        }
      }
    } finally {
      table.className = originalClass;
      reference.remove();
    }
  },
};
