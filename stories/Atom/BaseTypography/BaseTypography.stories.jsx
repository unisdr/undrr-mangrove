import { Heading as HeadingComponent } from '../Typography/Heading/Heading';
import { Abbreviation as AbbrComponent } from './Abbr/Abbr';
import { Blockquote } from './Blockquote/Blockquote';
import { Cite as CiteComponent } from './Cite/Cite';
import { Code as CodeComponent } from './Code/Code';
import { Hr as HrComponent } from './Hr/Hr';
import { Mark as MarkComponent } from './Mark/Mark';
import { P as PComponent } from './Paragraph/Paragraph';
import { Quotation as QuotationComponent } from './Quotation/Quotation';
import { Small as SmallComponent } from './Small/Small';
import { List as ListComponent } from './../Typography/Lists/Lists';
import { Descriptionlist as DescriptionListComponent } from './../Typography/Lists/Descriptionlist';
import { DetailsTag as DetailsComponent } from '../ReachElement/Details/Details';
import { Figcaption as FigcaptionComponent } from '../ReachElement/Figcaption/Figcaption';

const getCaptionForLocaleHeading = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        detail1: 'Headline 1',
        detail2: 'Headline 2',
        detail3: 'Headline 3',
        detail4: 'Headline 4',
        detail5: 'Headline 5',
        detail6: 'HEADLINE 6',
      };
      return engText;
    case 'arabic':
      const arabicText = {
        detail1: 'العنوان 1.',
        detail2: 'العنوان 2',
        detail3: 'العنوان 3',
        detail4: 'العنوان 4',
        detail5: 'العنوان 5',
        detail6: 'العنوان 6',
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        detail1: '見出し1',
        detail2: '見出し2',
        detail3: '見出し3',
        detail4: '見出し4',
        detail5: '見出し5',
        detail6: '見出し6',
      };
      return japaneseText;
    default:
      return {
        detail1: 'Headline 1',
        detail2: 'Headline 2',
        detail3: 'Headline 3',
        detail4: 'Headline 4',
        detail5: 'Headline 5',
        detail6: 'HEADLINE 6',
      };
  }
};

const getCaptionForLocaleAbbr = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        detail1: 'HyperText Markup Language',
        detail2: 'Cascading Style Sheets',
        text1: 'You can use',
        text2: 'to style your',
      };
      return engText;
    case 'arabic':
      const arabicText = {
        detail1: 'لغة ترميز النصوص التشعبية',
        detail2: 'اوراق النمط المتعاقب',
        text1: 'يمكنك استخدام',
        text2: 'لأسلوبك',
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        detail1: 'ハイパーテキストマークアップ言語',
        detail2: 'カスケードスタイルシート',
        text1: 'あなたが使用することができます',
        text2: 'あなたのスタイルを整える',
      };
      return japaneseText;
    default:
      return {
        detail1: 'HyperText Markup Language',
        detail2: 'Cascading Style Sheets',
        text1: 'You can use',
        text2: 'to style your',
      };
  }
};

const getCaptionForLocaleBlockquote = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        detail:
          '“UNDRR oversees the implementation of the Sendai Framework for Disaster Risk Reduction 2015-2030”',
        citeText: '-Firstname Lastname',
      };
      return engText;
    case 'arabic':
      const arabicText = {
        detail:
          '“بلوككوت هو ألم الإنترنت نفسه. من هو وسادة الانتقام في العبارة”',
        citeText: 'الاسم الاول الاسم الاخير-',
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        detail:
          '“ブロッククォートはインターネット自体の苦痛です。 フェリーの復讐に満ちたクッションは誰ですか”',
        citeText: '-名前苗字',
      };
      return japaneseText;
    default:
      return {
        detail:
          '“UNDRR oversees the implementation of the Sendai Framework for Disaster Risk Reduction 2015-2030”',
        citeText: '-Firstname Lastname',
      };
  }
};

const getCaptionForLocaleCite = locale => {
  switch (locale) {
    case 'english':
      const engText = { detail: '-Firstname Lastname' };
      return engText;
    case 'arabic':
      const arabicText = { detail: 'الاسم الاول الاسم الاخير-' };
      return arabicText;
    case 'japanese':
      const japaneseText = { detail: '-名前苗字' };
      return japaneseText;
    default:
      return { detail: '-Firstname Lastname' };
  }
};

const getCaptionForLocaleCode = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        detail1: 'The',
        detail2: 'length()',
        detail3: 'method on a',
        detail4: 'String',
        detail5:
          'object contains the length of the string. It can also serve as a character counter.',
      };
      return engText;
    case 'arabic':
      const arabicText = {
        detail1: 'ال',
        detail2: 'الطول()',
        detail3: 'طريقة على',
        detail4: '',
        detail5:
          'يحتوي الكائن على طول السلسلة. يمكن أن يكون أيضًا بمثابة عداد أحرف.',
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        detail1: 'NS',
        detail2: '長さ（）',
        detail3: '上のメソッド',
        detail4: '弦',
        detail5:
          'オブジェクトには文字列の長さが含まれます。キャラクターカウンターとしても使用できます。',
      };
      return japaneseText;
    default:
      return {
        detail1: 'The',
        detail2: 'length()',
        detail3: 'method on a',
        detail4: 'String',
        detail5:
          'object contains the length of the string. It can also serve as a character counter.',
      };
  }
};

const getCaptionForLocaleCodeBlock = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        blockCode: `// React component example
import React from 'react';

const MyComponent = ({ title, children }) => {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      {children}
    </div>
  );
};

export default MyComponent;`,
      };
      return engText;
    case 'arabic':
      const arabicText = {
        blockCode: `// مثال مكون React
import React from 'react';

const MyComponent = ({ title, children }) => {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      {children}
    </div>
  );
};

export default MyComponent;`,
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        blockCode: `// Reactコンポーネントの例
import React from 'react';

const MyComponent = ({ title, children }) => {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      {children}
    </div>
  );
};

export default MyComponent;`,
      };
      return japaneseText;
    default:
      return {
        blockCode: `// React component example
import React from 'react';

const MyComponent = ({ title, children }) => {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      {children}
    </div>
  );
};

export default MyComponent;`,
      };
  }
};

const getLocaleForDetails = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        summary: 'The Sendai Framework',
        details: 'The Sendai Framework',
      };
      return engText;
    case 'arabic':
      const arabicText = {
        summary: 'مركز The Sendai Framework',
        details:
          ': هي حديقة ترفيهية في is the global roadmap for reducing human and economic loss تضم معالم جذب مثيرة وأجنحة دولية وألعاب نارية حائزة على جوائز ومناسبات موسمية خاصة.',
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        summary: 'エプコットセンター',
        details:
          ':は、エキサイティングなアトラクション、国際的なパビリオン、受賞歴のある花火、季節の特別イベントを備えたウォルトディズニーワールドリゾートのテーマパークです。',
      };
      return japaneseText;
    default:
      return {
        summary: 'The Sendai Framework',
        details:
          'is the global roadmap for reducing human and economic loss as a direct result of disasters.',
      };
  }
};

const getLocaleForFigcaption = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        details:
          'As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. ',
      };
      return engText;
    case 'arabic':
      const arabicText = {
        details:
          'يشير النص الوهمي إلى أجزاء المحتوى المستخدمة لملء نموذج موقع الويب. يساعد هذا النص مصممي الويب على تصور أفضل لكيفية ظهور موقع الويب كمنتج نهائي.',
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        details:
          'ダミーテキストとは、Webサイトのモックアップを埋めるために使用されるコンテンツの一部を指します。このテキストは、WebデザイナーがWebサイトが完成品としてどのように見えるかをよりよく想像するのに役立ちます。',
      };
      return japaneseText;
    default:
      return {
        details:
          'As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. ',
      };
  }
};

const getCaptionForLocaleHr = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        detail:
          'UNDRR (formerly UNISDR) is the United Nations focal point for disaster risk reduction. UNDRR oversees the implementation of the Sendai Framework for Disaster Risk Reduction 2015-2030, supporting countries in its implementation, monitoring and sharing what works in reducing existing risk and preventing the creation of new risk.',
      };
      return engText;
    case 'arabic':
      const arabicText = {
        detail:
          'فقرة كبيرة  UNDRR convenes partners and coordinates activities to create safer, more resilient communities. نولا فاسيليسي.-',
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        detail:
          '大きな段落はインターネット自体の苦痛です。  UNDRR convenes partners and coordinates activities to create safer, more resilient communities.。誰もが本物、または漫画自体を嫌う必要があります。しかし、矢筒は資産です。悲しみは大変なことです。住宅の必要性が痛みを必要としないまで。しかし、どれほど素晴らしくて醜い。複雑なことは何もありません。',
      };
      return japaneseText;
    default:
      return {
        detail:
          'UNDRR (formerly UNISDR) is the United Nations focal point for disaster risk reduction. UNDRR oversees the implementation of the Sendai Framework for Disaster Risk Reduction 2015-2030, supporting countries in its implementation, monitoring and sharing what works in reducing existing risk and preventing the creation of new risk.',
      };
  }
};

const getCaptionForLocaleMark = locale => {
  switch (locale) {
    case 'english':
      const engText = { detail: 'The Sendai Framework' };
      return engText;
    case 'arabic':
      const arabicText = { detail: 'لا إزعاج' };
      return arabicText;
    case 'japanese':
      const japaneseText = { detail: '不快感なし' };
      return japaneseText;
    default:
      return { detail: 'The Sendai Framework' };
  }
};

const getCaptionForLocaleParagraph = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        detail:
          'UNDRR (formerly UNISDR) is the United Nations focal point for disaster risk reduction. UNDRR oversees the implementation of the Sendai Framework for Disaster Risk Reduction 2015-2030, supporting countries in its implementation, monitoring and sharing what works in reducing existing risk and preventing the creation of new risk.',
      };
      return engText;
    case 'arabic':
      const arabicText = {
        detail:
          'فقرة كبيرة UN Office for Disaster Risk Reduction نولا فاسيليسي.-',
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        detail:
          '大きな段落はインターネット自体の苦痛です。 Pellentesque porttitor mauris quis pulvinarultrices。誰もが本物、または漫画自体を嫌う必要があります。しかし、矢筒は資産です。悲しみは大変なことです。住宅の必要性が痛みを必要としないまで。しかし、どれほど素晴らしくて醜い。複雑なことは何もありません。',
      };
      return japaneseText;
    default:
      return {
        detail:
          'UNDRR (formerly UNISDR) is the United Nations focal point for disaster risk reduction. UNDRR oversees the implementation of the Sendai Framework for Disaster Risk Reduction 2015-2030, supporting countries in its implementation, monitoring and sharing what works in reducing existing risk and preventing the creation of new risk.',
      };
  }
};

const getCaptionForLocaleQuotation = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        detail:
          'The Sendai Framework is the global roadmap for reducing human and economic loss as a direct result of disasters.',
      };
      return engText;
    case 'arabic':
      const arabicText = {
        detail:
          'يفكر العلماء فيما إذا كانت الأرض قد دخلت حقبة جيولوجية جديدة تمامًا: الأنثروبوسين ، أو عصر البشر.',
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        detail:
          '科学者たちは、地球がまったく新しい地質学的時代、人新世、または人間の時代に入ったかどうかを検討しています。',
      };
      return japaneseText;
    default:
      return {
        detail:
          'The Sendai Framework is the global roadmap for reducing human and economic loss as a direct result of disasters.',
      };
  }
};

const getCaptionForLocaleSmall = locale => {
  switch (locale) {
    case 'english':
      const engText = { detail: 'UN Office for Disaster Risk Reduction.' };
      return engText;
    case 'arabic':
      const arabicText = {
        detail: 'UN Office for Disaster Risk Reduction.',
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        detail: 'そして盲目になると、彼は迷惑をかけずに彼らを撃退します。',
      };
      return japaneseText;
    default:
      return { detail: 'UN Office for Disaster Risk Reduction.' };
  }
};

const getCaptionForLocaleList = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        data: [
          {
            label: 'United Nations Office for Disaster Risk Reduction',
            text: 'UNDRR brings governments, partners and communities together to reduce disaster risk and losses to ensure a safer, more sustainable future.',
          },
          {
            label: 'United Nations Office for Disaster Risk Reduction',
            text: 'UNDRR brings governments, partners and communities together to reduce disaster risk and losses to ensure a safer, more sustainable future.',
          },
          {
            label: 'United Nations Office for Disaster Risk Reduction',
            text: 'UNDRR brings governments, partners and communities together to reduce disaster risk and losses to ensure a safer, more sustainable future.',
          },
        ],
      };
      return engText.data;
    case 'arabic':
      const arabicText = {
        data: [
          {
            label: 'برنامج الأمم المتحدة الإنمائي',
            text: 'برنامج الأمم المتحدة الإنمائي هو شبكة التنمية العالمية للأمم المتحدة. وهي تعزز التعاون التقني والاستثماري بين الدول وتدعو للتغيير وتربط البلدان بالمعرفة والخبرة والموارد لمساعدة الناس على بناء حياة أفضل لأنفسهم.',
          },
          {
            label: 'برنامج الأمم المتحدة الإنمائي',
            text: 'برنامج الأمم المتحدة الإنمائي هو شبكة التنمية العالمية للأمم المتحدة. وهي تعزز التعاون التقني والاستثماري بين الدول وتدعو للتغيير وتربط البلدان بالمعرفة والخبرة والموارد لمساعدة الناس على بناء حياة أفضل لأنفسهم.',
          },
          {
            label: 'برنامج الأمم المتحدة الإنمائي',
            text: 'برنامج الأمم المتحدة الإنمائي هو شبكة التنمية العالمية للأمم المتحدة. وهي تعزز التعاون التقني والاستثماري بين الدول وتدعو للتغيير وتربط البلدان بالمعرفة والخبرة والموارد لمساعدة الناس على بناء حياة أفضل لأنفسهم.',
          },
        ],
      };
      return arabicText.data;
    case 'japanese':
      const japaneseText = {
        data: [
          {
            label: '国連開発計画',
            text: '国連開発計画は、国連のグローバルな開発ネットワークです。 それは、国家間の技術的および投資協力を促進し、変化を提唱し、人々がより良い生活を築くのを助けるために、国家を知識、経験および資源に結び付けます。',
          },
          {
            label: '国連開発計画',
            text: '国連開発計画は、国連のグローバルな開発ネットワークです。 それは、国家間の技術的および投資協力を促進し、変化を提唱し、人々がより良い生活を築くのを助けるために、国家を知識、経験および資源に結び付けます。',
          },
          {
            label: '国連開発計画',
            text: '国連開発計画は、国連のグローバルな開発ネットワークです。 それは、国家間の技術的および投資協力を促進し、変化を提唱し、人々がより良い生活を築くのを助けるために、国家を知識、経験および資源に結び付けます。',
          },
        ],
      };
      return japaneseText.data;
    default:
      const dummy = {
        data: [
          {
            label: 'United Nations Office for Disaster Risk Reduction',
            text: 'UNDRR brings governments, partners and communities together to reduce disaster risk and losses to ensure a safer, more sustainable future.',
          },
          {
            label: 'United Nations Office for Disaster Risk Reduction',
            text: 'UNDRR brings governments, partners and communities together to reduce disaster risk and losses to ensure a safer, more sustainable future.',
          },
          {
            label: 'United Nations Office for Disaster Risk Reduction',
            text: 'UNDRR brings governments, partners and communities together to reduce disaster risk and losses to ensure a safer, more sustainable future.',
          },
        ],
      };
      return dummy.data;
  }
};

const Template =
  (Component, getLocaleCaption) =>
  (args, { globals: { locale } }) => {
    const caption = getLocaleCaption(locale);
    return <Component {...caption} {...args} />;
  };

const ListTemplate =
  (Component, getLocaleCaption, listType) =>
  (args, { globals: { locale } }) => {
    const caption = getLocaleCaption(locale);
    return <Component data={caption} type={listType} {...args} />;
  };

const DescriptionListTemplate =
  (Component, getLocaleCaption) =>
  (args, { globals: { locale } }) => {
    const caption = getLocaleCaption(locale);
    return <Component data={caption} {...args} />;
  };

export default {
  title: 'Components/Typography',
  parameters: {
    viewMode: 'docs',
    previewTabs: {
      canvas: { hidden: true },
    },
  },
};

// Wrapper to demonstrate all heading levels in Storybook
const HeadingDemo = ({
  detail1,
  detail2,
  detail3,
  detail4,
  detail5,
  detail6,
  ...props
}) => (
  <div>
    <HeadingComponent type="1" {...props}>
      {detail1}
    </HeadingComponent>
    <HeadingComponent type="2" {...props}>
      {detail2}
    </HeadingComponent>
    <HeadingComponent type="3" {...props}>
      {detail3}
    </HeadingComponent>
    <HeadingComponent type="4" {...props}>
      {detail4}
    </HeadingComponent>
    <HeadingComponent type="5" {...props}>
      {detail5}
    </HeadingComponent>
    <HeadingComponent type="6" {...props}>
      {detail6}
    </HeadingComponent>
  </div>
);

// Document structure - Headings
export const TypographyHeading = Template(
  HeadingDemo,
  getCaptionForLocaleHeading
);

// Basic text content
export const TypographyParagraph = Template(
  PComponent,
  getCaptionForLocaleParagraph
);
TypographyParagraph.argTypes = {
  size: {
    control: 'select',
    options: [
      '',
      '150',
      '200',
      '250',
      '300',
      '400',
      '500',
      '600',
      '800',
      '900',
    ],
    labels: { '': 'Default (inherited)' },
    description: 'Apply a font-size utility class (mg-u-font-size-*)',
  },
};

// Text formatting and emphasis
export const TypographyMark = Template(MarkComponent, getCaptionForLocaleMark);
export const TypographySmall = Template(
  SmallComponent,
  getCaptionForLocaleSmall
);
export const TypographyCode = Template(CodeComponent, getCaptionForLocaleCode);
export const TypographyCodeBlock = Template(
  CodeComponent,
  getCaptionForLocaleCodeBlock
);
export const TypographyAbbreviation = Template(
  AbbrComponent,
  getCaptionForLocaleAbbr
);

// Quotations and citations
export const TypographyBlockquote = Template(
  Blockquote,
  getCaptionForLocaleBlockquote
);
export const TypographyQuotation = Template(
  QuotationComponent,
  getCaptionForLocaleQuotation
);
export const TypographyCite = Template(CiteComponent, getCaptionForLocaleCite);

// Lists
export const TypographyListOrdered = ListTemplate(
  ListComponent,
  getCaptionForLocaleList,
  'ol'
);
export const TypographyListUnordered = ListTemplate(
  ListComponent,
  getCaptionForLocaleList,
  'ul'
);
export const TypographyListDescription = DescriptionListTemplate(
  DescriptionListComponent,
  getCaptionForLocaleList
);

// Interactive and structural elements
export const TypographyDetails = Template(
  DetailsComponent,
  getLocaleForDetails
);
export const TypographyFigcaption = Template(
  FigcaptionComponent,
  getLocaleForFigcaption
);

// Separators
export const TypographyHr = Template(HrComponent, getCaptionForLocaleHr);
