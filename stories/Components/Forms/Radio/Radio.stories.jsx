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
        errorText: 'يرجى تحديد خيار',
        rowLegend: 'كيف نرسل إليك الإنذارات المبكرة؟',
        rowItems: [
          { label: 'رسالة نصية', value: 'sms' },
          { label: 'الإذاعة المحلية', value: 'radio' },
          {
            label:
              'زيارات من منزل إلى منزل يقوم بها متطوعون مدرَّبون، للأسر التي لا تصلها إشارة الهاتف ولا الإذاعة أو التي يحتاج أحد أفرادها إلى مساعدة في الإخلاء',
            value: 'visit',
          },
        ],
        rowStates: {
          rest: 'غير محدد',
          checked: 'محدد',
          disabled: 'معطَّل',
          disabledChecked: 'معطَّل ومحدد',
          error: 'خطأ',
          before: 'التسمية قبل عنصر التحكم',
        },
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
        errorText: 'オプションを選択してください',
        rowLegend: '早期警報の受け取り方法を選択してください',
        rowItems: [
          { label: 'テキストメッセージ', value: 'sms' },
          { label: 'コミュニティラジオ', value: 'radio' },
          {
            label:
              '訓練を受けたボランティアによる戸別訪問。電話もラジオも届かない世帯や、避難に手助けが必要な方がいる世帯が対象です',
            value: 'visit',
          },
        ],
        rowStates: {
          rest: '未選択',
          checked: '選択済み',
          disabled: '無効',
          disabledChecked: '無効で選択済み',
          error: 'エラー',
          before: 'ラベルが先',
        },
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
        errorText: 'Please select an option',
        rowLegend: 'How should early warnings reach you?',
        rowItems: [
          { label: 'Text message', value: 'sms' },
          { label: 'Community radio', value: 'radio' },
          {
            label:
              'Door-to-door visits by trained volunteers, for households with no phone signal and no radio, or with someone who needs help to evacuate',
            value: 'visit',
          },
        ],
        rowStates: {
          rest: 'Not selected',
          checked: 'Selected',
          disabled: 'Disabled',
          disabledChecked: 'Disabled and selected',
          error: 'Error',
          before: 'Label before the control',
        },
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

export const ErrorState = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Radio
        label={caption.label}
        value="a"
        name="demo-error"
        error
        errorText={caption.errorText}
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

// The row variant: each option is a full-width target. The last option wraps,
// to show the control staying on the first line of its label.
export const Row = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <FormGroup legend={caption.rowLegend}>
        {caption.rowItems.map((item, index) => (
          <Radio
            row
            key={item.value}
            label={item.label}
            value={item.value}
            name="row-demo"
            defaultChecked={index === 1}
            {...args}
          />
        ))}
      </FormGroup>
    );
  },
};

export const RowStates = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const states = caption.rowStates;
    return (
      <>
        <Radio row label={states.rest} value="rest" name="row-rest" {...args} />
        <Radio
          row
          label={states.checked}
          value="checked"
          name="row-checked"
          defaultChecked
          {...args}
        />
        <Radio
          row
          label={states.disabled}
          value="disabled"
          name="row-disabled"
          disabled
          {...args}
        />
        <Radio
          row
          label={states.disabledChecked}
          value="disabled-checked"
          name="row-disabled-checked"
          disabled
          defaultChecked
          {...args}
        />
        <Radio
          row
          label={states.error}
          value="error"
          name="row-error"
          error
          errorText={caption.errorText}
          {...args}
        />
        <Radio
          row
          label={states.before}
          value="before"
          name="row-before"
          labelPosition="before"
          {...args}
        />
      </>
    );
  },
};
