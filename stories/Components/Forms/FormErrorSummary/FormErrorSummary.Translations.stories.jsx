/**
 * @file FormErrorSummary.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the FormErrorSummary component.
 *
 * Translatable prop: title (the heading displayed above the error list).
 * Defaults to "There is a problem" — pass to override.
 *
 * Note: individual error messages come from the `errors` prop and should be
 * translated in the form validation layer.
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import { FormErrorSummary } from './FormErrorSummary';

export default {
  title: 'Components/Forms/FormErrorSummary/Translations',
  component: FormErrorSummary,
};

const errors = [
  { id: 'field-name', message: 'Name is required.' },
  { id: 'field-email', message: 'Enter a valid email address.' },
];

export const Spanish = {
  args: { errors, title: 'Hay un problema' },
  name: 'Spanish (es)',
};

export const French = {
  args: { errors, title: 'Il y a un problème' },
  name: 'French (fr)',
};

export const Japanese = {
  args: { errors, title: '問題があります' },
  name: 'Japanese (ja)',
};

export const Chinese = {
  args: { errors, title: '存在问题' },
  name: 'Chinese (zh)',
};

export const Arabic = {
  args: { errors, title: 'توجد مشكلة' },
  name: 'Arabic (ar)',
};

export const Russian = {
  args: { errors, title: 'Есть проблема' },
  name: 'Russian (ru)',
};
