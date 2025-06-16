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
    case 'burmese':
      const burmeseText = {
        headertext: 'ဇယားခေါင်းစီး',
        tdtext: 'အကြောင်းအရာကဒီမှာ',
        details:
          'ထုတ်ဝေခြင်းနှင့် ဂရပ်ဖစ်ဒီဇိုင်းများတွင်၊  သည် သရုပ်ပြရန်အတွက် အသုံးများသော နေရာယူထားသော စာသားဖြစ်သည်။',
      };
      return burmeseText;
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
  name: "Default table",
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

  name: "Striped table",
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

  name: "Bordered table",
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

  name: "Small table",
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

  name: "Small striped table",
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

  name: "Stacked table (mobile-first)",
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

  name: "Scrollable table",
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

  name: "Bordered stacked table",
};
