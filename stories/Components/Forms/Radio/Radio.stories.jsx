import React from 'react';
import { Radio } from './Radio';
import { FormGroup } from '../FormGroup/FormGroup';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        label: 'الخيار أ',
        legend: 'حدد أولوية',
        items: [
          { label: 'منخفض', value: 'low' },
          { label: 'متوسط', value: 'medium' },
          { label: 'مرتفع', value: 'high' },
        ],
      };
    case 'burmese':
      return {
        label: 'ရွေးချယ်မှု A',
        legend: 'ဦးစားပေးကိုရွေးချယ်ပါ',
        items: [
          { label: 'နိမ့်', value: 'low' },
          { label: 'အလယ်', value: 'medium' },
          { label: 'မြင့်', value: 'high' },
        ],
      };
    case 'japanese':
      return {
        label: 'オプション A',
        legend: '優先度を選択',
        items: [
          { label: '低', value: 'low' },
          { label: '中', value: 'medium' },
          { label: '高', value: 'high' },
        ],
      };
    default:
      return {
        label: 'Option A',
        legend: 'Select a priority',
        items: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      };
  }
};

export default {
  title: 'Components/Forms/Radio',
  component: Radio,
};

export const Default = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Radio label={caption.label} value="a" name="demo" {...args} />;
  },
};

export const Selected = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Radio
        label={caption.label}
        value="a"
        name="demo-selected"
        defaultChecked
        {...args}
      />
    );
  },
};

export const Disabled = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Radio
        label={caption.label}
        value="a"
        name="demo-disabled"
        disabled
        {...args}
      />
    );
  },
};

export const LabelBefore = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Radio
        label={caption.label}
        value="a"
        name="demo-before"
        labelPosition="before"
        {...args}
      />
    );
  },
};

export const RadioGroup = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <FormGroup legend={caption.legend}>
        {caption.items.map(item => (
          <Radio
            key={item.value}
            label={item.label}
            value={item.value}
            name="priority"
            {...args}
          />
        ))}
      </FormGroup>
    );
  },
};
