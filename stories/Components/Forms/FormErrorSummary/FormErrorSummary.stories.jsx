import React from 'react';
import { FormErrorSummary } from './FormErrorSummary';
import { TextInput } from '../TextInput/TextInput';
import { FormGroup } from '../FormGroup/FormGroup';
import { Checkbox } from '../Checkbox/Checkbox';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        title: 'هناك مشكلة',
        emailError: 'أدخل عنوان بريد إلكتروني صالح',
        nameError: 'أدخل اسمك الكامل',
        interestsError: 'اختر اهتمامًا واحدًا على الأقل',
        emailLabel: 'البريد الإلكتروني',
        nameLabel: 'الاسم الكامل',
        interestsLegend: 'اختر اهتماماتك',
        checkboxes: [
          { label: 'الحد من مخاطر الكوارث', value: 'drr' },
          { label: 'تغير المناخ', value: 'climate' },
        ],
      };
    case 'japanese':
      return {
        title: '問題があります',
        emailError: '有効なメールアドレスを入力してください',
        nameError: '氏名を入力してください',
        interestsError: '少なくとも1つの関心分野を選択してください',
        emailLabel: 'メールアドレス',
        nameLabel: '氏名',
        interestsLegend: '興味のある分野を選択',
        checkboxes: [
          { label: '防災・減災', value: 'drr' },
          { label: '気候変動', value: 'climate' },
        ],
      };
    default:
      return {
        title: 'There is a problem',
        emailError: 'Enter a valid email address',
        nameError: 'Enter your full name',
        interestsError: 'Select at least one interest',
        emailLabel: 'Email address',
        nameLabel: 'Full name',
        interestsLegend: 'Select your interests',
        checkboxes: [
          { label: 'Disaster risk reduction', value: 'drr' },
          { label: 'Climate change', value: 'climate' },
        ],
      };
  }
};

export default {
  title: 'Components/Forms/FormErrorSummary',
  component: FormErrorSummary,
};

export const SingleError = {
  name: 'Single error',
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <>
        <FormErrorSummary
          title={caption.title}
          errors={[{ id: 'email', message: caption.emailError }]}
          {...args}
        />
        <TextInput
          id="email"
          label={caption.emailLabel}
          type="email"
          error
          errorText={caption.emailError}
        />
      </>
    );
  },
};

export const MultipleErrors = {
  name: 'Multiple errors',
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <>
        <FormErrorSummary
          title={caption.title}
          errors={[
            { id: 'full-name', message: caption.nameError },
            { id: 'email', message: caption.emailError },
            { id: 'interests', message: caption.interestsError },
          ]}
          {...args}
        />
        <TextInput
          id="full-name"
          label={caption.nameLabel}
          error
          errorText={caption.nameError}
        />
        <TextInput
          id="email"
          label={caption.emailLabel}
          type="email"
          error
          errorText={caption.emailError}
        />
        <FormGroup
          legend={caption.interestsLegend}
          error
          errorText={caption.interestsError}
        >
          {caption.checkboxes.map(item => (
            <Checkbox
              key={item.value}
              label={item.label}
              value={item.value}
              name="interests"
              id={item.value === 'drr' ? 'interests' : undefined}
            />
          ))}
        </FormGroup>
      </>
    );
  },
};
