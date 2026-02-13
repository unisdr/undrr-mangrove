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
  decorators: [
    Story => (
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <Story />
      </div>
    ),
  ],
};

const baseLineArgs = {
  quote:
    "One doesn't have to look hard to find examples of how disasters are becoming worse. The sad fact is that many of these disasters are preventable because they are caused by human decisions. The call to action of the Midterm Review is that countries need to reduce risk in every decision, action, and investment they make.",
  attribution: 'Mami Mizutori',
  attributionTitle:
    'Special Representative of the UN Secretary-General for Disaster Risk Reduction and head of UNDRR',
  variant: 'line',
  backgroundColor: 'light',
  alignment: 'full',
};

const baseImageArgs = {
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

const alignmentDecorator = Story => (
  <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
    <Story />
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
export const LineVariant = {
  args: { ...baseLineArgs },
};

export const LineVariantDark = {
  args: { ...baseLineArgs, backgroundColor: 'dark' },
};

export const LineVariantBright = {
  args: { ...baseLineArgs, backgroundColor: 'bright' },
};

export const LineVariantWithPortrait = {
  args: {
    ...baseLineArgs,
    imageSrc:
      'https://www.undrr.org/sites/default/files/styles/por/public/2020-12/2019-01-10_SRSG-Mami-Mizutori-HD_003.jpg',
    imageAlt: 'Mami Mizutori portrait',
  },
};

export const LineVariantWithImage = {
  args: {
    ...baseLineArgs,
    imageSrc:
      'https://www.undrr.org/sites/default/files/styles/por/public/2020-12/2019-01-10_SRSG-Mami-Mizutori-HD_003.jpg',
    imageAlt: 'Mami Mizutori portrait',
    variant: 'image',
  },
};

// Left alignment examples
export const LeftAlignedQuote = {
  args: {
    ...baseLineArgs,
    alignment: 'left',
    quote:
      "One doesn't have to look <a href='#'>hard</a> to find examples of how disasters are becoming worse.",
  },
  decorators: [alignmentDecorator],
};

export const LeftAlignedQuoteWithPortrait = {
  args: {
    ...baseLineArgs,
    alignment: 'left',
    quote:
      "One doesn't have to look <a href='#'>hard</a> to find examples of how disasters are becoming worse.",
    imageSrc:
      'https://www.undrr.org/sites/default/files/styles/por/public/2020-12/2019-01-10_SRSG-Mami-Mizutori-HD_003.jpg',
    imageAlt: 'Mami Mizutori portrait',
  },
  decorators: [alignmentDecorator],
};

// Right alignment examples
export const RightAlignedQuote = {
  args: {
    ...baseLineArgs,
    alignment: 'right',
    quote:
      "One doesn't have to look hard to find examples of how disasters are becoming worse.",
  },
  decorators: [alignmentDecorator],
};

export const RightAlignedQuoteWithPortrait = {
  args: {
    ...baseLineArgs,
    alignment: 'right',
    quote:
      "One doesn't have to look hard to find examples of how disasters are becoming worse.",
    imageSrc:
      'https://www.undrr.org/sites/default/files/styles/por/public/2020-12/2019-01-10_SRSG-Mami-Mizutori-HD_003.jpg',
    imageAlt: 'Mami Mizutori portrait',
  },
  decorators: [alignmentDecorator],
};

// RTL examples
export const RTLLeftAlignedQuote = {
  name: 'RTL Left Aligned (appears on right)',
  render: () => (
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
        هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا
        النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من
        النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق. إذا كنت
        تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد الفقرات
        كما تريد، النص لن يبدو مقسما ولا يحوي أخطاء لغوية، مولد النص العربى مفيد
        لمصممي المواقع على وجه الخصوص.
      </p>
    </div>
  ),
};

export const RTLRightAlignedQuote = {
  name: 'RTL Right Aligned (appears on left)',
  render: () => (
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
        هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا
        النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من
        النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق. إذا كنت
        تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد الفقرات
        كما تريد، النص لن يبدو مقسما ولا يحوي أخطاء لغوية، مولد النص العربى مفيد
        لمصممي المواقع على وجه الخصوص.
      </p>
    </div>
  ),
};

// Image variant examples
export const ImageVariant = {
  args: { ...baseImageArgs },
};

export const ImageVariantDark = {
  args: { ...baseImageArgs, backgroundColor: 'dark' },
};

export const ImageVariantBright = {
  args: { ...baseImageArgs, backgroundColor: 'bright' },
};

// Without attribution
export const WithoutAttribution = {
  args: {
    quote:
      "One doesn't have to look hard to find examples of how disasters are becoming worse.",
    variant: 'line',
    backgroundColor: 'light',
    alignment: 'full',
  },
};
