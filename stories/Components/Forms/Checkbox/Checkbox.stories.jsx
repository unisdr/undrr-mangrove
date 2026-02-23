import React from 'react';
import { Checkbox } from './Checkbox';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return { label: 'فئة', value: 'فئة' };
    case 'burmese':
      return { label: 'အမျိုးအစား', value: 'အမျိုးအစား' };
    case 'japanese':
      return { label: 'カテゴリー', value: 'カテゴリー' };
    default:
      return { label: 'Category', value: 'category' };
  }
};

export default {
  title: 'Components/Forms/Checkbox',
  component: Checkbox,
};

export const Default = {
  args: {
    label: 'Accept terms and conditions',
    value: 'terms',
  },
};

export const Checked = {
  args: {
    label: 'Accept terms and conditions',
    value: 'terms',
    defaultChecked: true,
  },
};

export const Disabled = {
  args: {
    label: 'Accept terms and conditions',
    value: 'terms',
    disabled: true,
  },
};

export const LabelBefore = {
  args: {
    label: 'Accept terms and conditions',
    value: 'terms',
    labelPosition: 'before',
  },
};

export const CheckboxGroup = {
  render: () => (
    <fieldset>
      <legend>Select your interests</legend>
      <Checkbox label="Disaster risk reduction" value="drr" name="interests" />
      <Checkbox label="Climate change" value="climate" name="interests" />
      <Checkbox label="Resilience" value="resilience" name="interests" />
    </fieldset>
  ),
};

export const Localized = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Checkbox label={caption.label} value={caption.value} {...args} />;
  },
};
