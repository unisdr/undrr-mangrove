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
