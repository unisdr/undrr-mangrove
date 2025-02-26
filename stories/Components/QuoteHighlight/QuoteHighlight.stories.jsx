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
      options: ['light-blue', 'blue', 'white'],
    },
    variant: {
      control: { type: 'radio' },
      options: ['line', 'image'],
    },
  },
};

const Template = (args) => (
  <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
    <QuoteHighlight {...args} />
  </div>
);

// Line variant examples
export const LineVariant = Template.bind({});
LineVariant.args = {
  quote: "One doesn't have to look hard to find examples of how disasters are becoming worse. The sad fact is that many of these disasters are preventable because they are caused by human decisions. The call to action of the Midterm Review is that countries need to reduce risk in every decision, action, and investment they make.",
  attribution: "Mami Mizutori",
  attributionTitle: "Special Representative of the UN Secretary-General for Disaster Risk Reduction and head of UNDRR",
  variant: "line",
  backgroundColor: "light-blue",
};

export const LineVariantBlue = Template.bind({});
LineVariantBlue.args = {
  ...LineVariant.args,
  backgroundColor: "blue",
};

export const LineVariantWhite = Template.bind({});
LineVariantWhite.args = {
  ...LineVariant.args,
  backgroundColor: "white",
};

// Line variant with portrait image
export const LineVariantWithPortrait = Template.bind({});
LineVariantWithPortrait.args = {
  ...LineVariant.args,
  imageSrc: "https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png",
  imageAlt: "Mami Mizutori portrait",
};

// Line variant with image
export const LineVariantWithImage = Template.bind({});
LineVariantWithImage.args = {
  ...LineVariant.args,
  imageSrc: "https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png",
  imageAlt: "Mami Mizutori portrait",
};

export const LineVariantWithImageBlue = Template.bind({});
LineVariantWithImageBlue.args = {
  ...LineVariantWithImage.args,
  backgroundColor: "blue",
};

export const LineVariantWithImageWhite = Template.bind({});
LineVariantWithImageWhite.args = {
  ...LineVariantWithImage.args,
  backgroundColor: "white",
};

// Image variant examples
export const ImageVariant = Template.bind({});
ImageVariant.args = {
  quote: "One doesn't have to look hard to find examples of how disasters are becoming worse. The sad fact is that many of these disasters are preventable because they are caused by human decisions.",
  attribution: "Mami Mizutori",
  attributionTitle: "Special Representative of the UN Secretary-General for Disaster Risk Reduction and head of UNDRR",
  imageSrc: "/assets/author.png",
  imageAlt: "Mami Mizutori portrait",
  variant: "image",
  backgroundColor: "light-blue",
};

export const ImageVariantBlue = Template.bind({});
ImageVariantBlue.args = {
  ...ImageVariant.args,
  backgroundColor: "blue",
};

export const ImageVariantWhite = Template.bind({});
ImageVariantWhite.args = {
  ...ImageVariant.args,
  backgroundColor: "white",
};

// Image variant without image (fallback to line style)
export const ImageVariantWithoutImage = Template.bind({});
ImageVariantWithoutImage.args = {
  quote: "Alongside the devastating loss of loved ones, communities across the country are now struggling to build back better in the wake of large economic losses and damage to the environment and critical infrastructure.",
  attribution: "António Guterres",
  attributionTitle: "UN Secretary-General",
  variant: "image", // This will fall back to looking like line variant since no image is provided
  backgroundColor: "light-blue",
};

export const ImageVariantWithoutImageBlue = Template.bind({});
ImageVariantWithoutImageBlue.args = {
  ...ImageVariantWithoutImage.args,
  backgroundColor: "blue",
};

export const ImageVariantWithoutImageWhite = Template.bind({});
ImageVariantWithoutImageWhite.args = {
  ...ImageVariantWithoutImage.args,
  backgroundColor: "white",
};

// Without attribution examples
export const WithoutAttribution = Template.bind({});
WithoutAttribution.args = {
  quote: "Disasters don't have to turn into catastrophes. We can prevent and reduce risk by taking action today for a safer tomorrow.",
  variant: "line",
  backgroundColor: "white",
};

export const WithoutAttributionWithImage = Template.bind({});
WithoutAttributionWithImage.args = {
  quote: "Disasters don't have to turn into catastrophes. We can prevent and reduce risk by taking action today for a safer tomorrow.",
  imageSrc: "https://www.undrr.org/sites/default/files/styles/width_780/public/2020-01/Mami%20Mizutori%20-%20for%20web.jpg",
  imageAlt: "UNDRR representative",
  variant: "image",
  backgroundColor: "light-blue",
};
