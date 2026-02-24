import React from 'react';
import { FormGroup } from './FormGroup';
import { Checkbox } from '../Checkbox/Checkbox';
import { Radio } from '../Radio/Radio';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        checkboxLegend: 'اختر اهتماماتك',
        radioLegend: 'حدد أولوية',
        checkboxes: [
          { label: 'الحد من مخاطر الكوارث', value: 'drr' },
          { label: 'تغير المناخ', value: 'climate' },
          { label: 'المرونة', value: 'resilience' },
        ],
        radios: [
          { label: 'منخفض', value: 'low' },
          { label: 'متوسط', value: 'medium' },
          { label: 'مرتفع', value: 'high' },
        ],
        errorText: 'يرجى اختيار خيار واحد على الأقل',
      };
    case 'burmese':
      return {
        checkboxLegend: 'သင်၏စိတ်ဝင်စားမှုများကိုရွေးချယ်ပါ',
        radioLegend: 'ဦးစားပေးကိုရွေးချယ်ပါ',
        checkboxes: [
          { label: 'ဘေးအန္တရာယ်လျှော့ချရေး', value: 'drr' },
          { label: 'ရာသီဥတုပြောင်းလဲမှု', value: 'climate' },
          { label: 'ခံနိုင်ရည်', value: 'resilience' },
        ],
        radios: [
          { label: 'နိမ့်', value: 'low' },
          { label: 'အလယ်', value: 'medium' },
          { label: 'မြင့်', value: 'high' },
        ],
        errorText: 'အနည်းဆုံးရွေးချယ်မှုတစ်ခုကိုရွေးချယ်ပါ',
      };
    case 'japanese':
      return {
        checkboxLegend: '興味のある分野を選択',
        radioLegend: '優先度を選択',
        checkboxes: [
          { label: '防災・減災', value: 'drr' },
          { label: '気候変動', value: 'climate' },
          { label: 'レジリエンス', value: 'resilience' },
        ],
        radios: [
          { label: '低', value: 'low' },
          { label: '中', value: 'medium' },
          { label: '高', value: 'high' },
        ],
        errorText: '少なくとも1つ選択してください',
      };
    default:
      return {
        checkboxLegend: 'Select your interests',
        radioLegend: 'Select a priority',
        checkboxes: [
          { label: 'Disaster risk reduction', value: 'drr' },
          { label: 'Climate change', value: 'climate' },
          { label: 'Resilience', value: 'resilience' },
        ],
        radios: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
        errorText: 'Please select at least one option',
      };
  }
};

export default {
  title: 'Components/Forms/FormGroup',
  component: FormGroup,
};

export const CheckboxGroupStory = {
  name: 'Checkbox group',
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <FormGroup legend={caption.checkboxLegend} {...args}>
        {caption.checkboxes.map(item => (
          <Checkbox
            key={item.value}
            label={item.label}
            value={item.value}
            name="interests"
          />
        ))}
      </FormGroup>
    );
  },
};

export const RadioGroupStory = {
  name: 'Radio group',
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <FormGroup legend={caption.radioLegend} {...args}>
        {caption.radios.map(item => (
          <Radio
            key={item.value}
            label={item.label}
            value={item.value}
            name="priority"
          />
        ))}
      </FormGroup>
    );
  },
};

export const Disabled = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <FormGroup legend={caption.radioLegend} disabled {...args}>
        {caption.radios.map(item => (
          <Radio
            key={item.value}
            label={item.label}
            value={item.value}
            name="priority-disabled"
          />
        ))}
      </FormGroup>
    );
  },
};

export const ErrorState = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <FormGroup
        legend={caption.checkboxLegend}
        error
        errorText={caption.errorText}
        {...args}
      >
        {caption.checkboxes.map(item => (
          <Checkbox
            key={item.value}
            label={item.label}
            value={item.value}
            name="interests-error"
          />
        ))}
      </FormGroup>
    );
  },
};

export const HiddenLegend = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <FormGroup legend={caption.checkboxLegend} hideLegend {...args}>
        {caption.checkboxes.map(item => (
          <Checkbox
            key={item.value}
            label={item.label}
            value={item.value}
            name="interests-hidden"
          />
        ))}
      </FormGroup>
    );
  },
};
