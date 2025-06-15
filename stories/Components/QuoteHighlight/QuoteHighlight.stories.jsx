import React from 'react';
import QuoteHighlight from './QuoteHighlight';

export default {
  title: 'Components/QuoteHighlight',
  component: QuoteHighlight,
  argTypes: {
    quote: { control: 'text' },
    attribution: { control: 'text' },
    attributionTitle: { control: 'text' },
    imageSrc: { control: 'text' },
    imageAlt: { control: 'text' },
    backgroundColor: {
      control: { type: 'select' },
      options: ['light', 'dark', 'bright'],
    },
    variant: {
      control: { type: 'radio' },
      options: ['line', 'image'],
    },
    alignment: {
      control: { type: 'radio' },
      options: ['full', 'left', 'right'],
    },
  },
};

const Template = args => (
  <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
    <QuoteHighlight {...args} />
  </div>
);

// For alignment examples, we need to show surrounding content
const AlignmentTemplate = args => (
  <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
    <QuoteHighlight {...args} />
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod,
      nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl
      nunc quis nisl. Nullam euismod, nisl eget aliquam ultricies, nunc nisl
      aliquet nunc, quis aliquam nisl nunc quis nisl. Nullam euismod, nisl eget
      aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis
      nisl.
    </p>
    <p>
      Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis
      aliquam nisl nunc quis nisl. Nullam euismod, nisl eget aliquam ultricies,
      nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl. Nullam euismod,
      nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl
      nunc quis nisl.
    </p>
  </div>
);

// Line variant examples
export const LineVariant = Template.bind({});
LineVariant.args = {
  quote:
    "One doesn't have to look hard to find examples of how disasters are becoming worse. The sad fact is that many of these disasters are preventable because they are caused by human decisions. The call to action of the Midterm Review is that countries need to reduce risk in every decision, action, and investment they make.",
  attribution: 'Mami Mizutori',
  attributionTitle:
    'Special Representative of the UN Secretary-General for Disaster Risk Reduction and head of UNDRR',
  variant: 'line',
  backgroundColor: 'light',
  alignment: 'full',
};

export const LineVariantDark = Template.bind({});
LineVariantDark.args = {
  ...LineVariant.args,
  backgroundColor: 'dark',
};

export const LineVariantBright = Template.bind({});
LineVariantBright.args = {
  ...LineVariant.args,
  backgroundColor: 'bright',
};

// Line variant with portrait image
export const LineVariantWithPortrait = Template.bind({});
LineVariantWithPortrait.args = {
  ...LineVariant.args,
  imageSrc:
    'https://www.undrr.org/sites/default/files/styles/por/public/2020-12/2019-01-10_SRSG-Mami-Mizutori-HD_003.jpg',
  imageAlt: 'Mami Mizutori portrait',
};

// Line variant with image
export const LineVariantWithImage = Template.bind({});
LineVariantWithImage.args = {
  ...LineVariant.args,
  imageSrc:
    'https://www.undrr.org/sites/default/files/styles/por/public/2020-12/2019-01-10_SRSG-Mami-Mizutori-HD_003.jpg',
  imageAlt: 'Mami Mizutori portrait',
  variant: 'image',
};

// Left alignment examples
export const LeftAlignedQuote = AlignmentTemplate.bind({});
LeftAlignedQuote.args = {
  ...LineVariant.args,
  alignment: 'left',
  quote:
    "One doesn't have to look <a href='#'>hard</a> to find examples of how disasters are becoming worse.",
};

export const LeftAlignedQuoteWithPortrait = AlignmentTemplate.bind({});
LeftAlignedQuoteWithPortrait.args = {
  ...LeftAlignedQuote.args,
  imageSrc:
    'https://www.undrr.org/sites/default/files/styles/por/public/2020-12/2019-01-10_SRSG-Mami-Mizutori-HD_003.jpg',
  imageAlt: 'Mami Mizutori portrait',
};

// Right alignment examples
export const RightAlignedQuote = AlignmentTemplate.bind({});
RightAlignedQuote.args = {
  ...LineVariant.args,
  alignment: 'right',
  quote:
    "One doesn't have to look hard to find examples of how disasters are becoming worse.",
};

export const RightAlignedQuoteWithPortrait = AlignmentTemplate.bind({});
RightAlignedQuoteWithPortrait.args = {
  ...RightAlignedQuote.args,
  imageSrc:
    'https://www.undrr.org/sites/default/files/styles/por/public/2020-12/2019-01-10_SRSG-Mami-Mizutori-HD_003.jpg',
  imageAlt: 'Mami Mizutori portrait',
};

// RTL example with left alignment (will appear on right in RTL)
export const RTLLeftAlignedQuote = () => (
  <div style={{ maxWidth: '800px', margin: '2rem auto', direction: 'rtl' }}>
    <QuoteHighlight
      quote="One doesn't have to look hard to find examples of how disasters are becoming worse."
      attribution="Mami Mizutori"
      attributionTitle="Special Representative of the UN Secretary-General for Disaster Risk Reduction"
      variant="line"
      backgroundColor="light"
      alignment="left"
    />
    <p>
      هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص
      من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص
      الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق. إذا كنت تحتاج إلى
      عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد الفقرات كما تريد،
      النص لن يبدو مقسما ولا يحوي أخطاء لغوية، مولد النص العربى مفيد لمصممي
      المواقع على وجه الخصوص.
    </p>
  </div>
);
RTLLeftAlignedQuote.storyName = 'RTL Left Aligned (appears on right)';

// RTL example with right alignment (will appear on left in RTL)
export const RTLRightAlignedQuote = () => (
  <div style={{ maxWidth: '800px', margin: '2rem auto', direction: 'rtl' }}>
    <QuoteHighlight
      quote="One doesn't have to look hard to find examples of how disasters are becoming worse."
      attribution="Mami Mizutori"
      attributionTitle="Special Representative of the UN Secretary-General for Disaster Risk Reduction"
      variant="line"
      backgroundColor="light"
      alignment="right"
    />
    <p>
      هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص
      من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص
      الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق. إذا كنت تحتاج إلى
      عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد الفقرات كما تريد،
      النص لن يبدو مقسما ولا يحوي أخطاء لغوية، مولد النص العربى مفيد لمصممي
      المواقع على وجه الخصوص.
    </p>
  </div>
);
RTLRightAlignedQuote.storyName = 'RTL Right Aligned (appears on left)';

// Image variant examples
export const ImageVariant = Template.bind({});
ImageVariant.args = {
  quote:
    "One doesn't have to look hard to find examples of how disasters are becoming worse. The sad fact is that many of these disasters are preventable because they are caused by human decisions.",
  attribution: 'Mami Mizutori',
  attributionTitle:
    'Special Representative of the UN Secretary-General for Disaster Risk Reduction and head of UNDRR',
  imageSrc:
    'https://www.undrr.org/sites/default/files/styles/por/public/2020-12/2019-01-10_SRSG-Mami-Mizutori-HD_003.jpg',
  imageAlt: 'Mami Mizutori portrait',
  variant: 'image',
  backgroundColor: 'light',
  alignment: 'full',
};

export const ImageVariantDark = Template.bind({});
ImageVariantDark.args = {
  ...ImageVariant.args,
  backgroundColor: 'dark',
};

export const ImageVariantBright = Template.bind({});
ImageVariantBright.args = {
  ...ImageVariant.args,
  backgroundColor: 'bright',
};

// Without attribution
export const WithoutAttribution = Template.bind({});
WithoutAttribution.args = {
  quote:
    "One doesn't have to look hard to find examples of how disasters are becoming worse.",
  variant: 'line',
  backgroundColor: 'light',
  alignment: 'full',
};
