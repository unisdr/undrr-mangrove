import React from 'react';
import { Radio } from './Radio';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return { label: 'فئة' };
    case 'burmese':
      return { label: 'အမျိုးအစား' };
    case 'japanese':
      return { label: 'カテゴリー' };
    default:
      return { label: 'Category' };
  }
};

export default {
  title: 'Components/Forms/Radio',
  component: Radio,
};

export const Default = {
  args: {
    label: 'Option A',
    value: 'a',
    name: 'demo',
  },
};

export const Selected = {
  args: {
    label: 'Option A',
    value: 'a',
    name: 'demo-selected',
    defaultChecked: true,
  },
};

export const Disabled = {
  args: {
    label: 'Option A',
    value: 'a',
    name: 'demo-disabled',
    disabled: true,
  },
};

export const LabelBefore = {
  args: {
    label: 'Option A',
    value: 'a',
    name: 'demo-before',
    labelPosition: 'before',
  },
};

export const RadioGroup = {
  render: () => (
    <fieldset>
      <legend>Select a priority</legend>
      <Radio label="Low" value="low" name="priority" />
      <Radio label="Medium" value="medium" name="priority" />
      <Radio label="High" value="high" name="priority" />
    </fieldset>
  ),
};

export const Localized = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Radio
        label={caption.label}
        value="localized"
        name="localized"
        {...args}
      />
    );
  },
};
