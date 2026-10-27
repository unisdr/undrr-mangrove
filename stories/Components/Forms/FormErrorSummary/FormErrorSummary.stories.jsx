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
    case 'spanish':
      return {
        title: 'Hay un problema',
        emailError: 'Introduzca una dirección de correo electrónico válida',
        nameError: 'Introduzca su nombre completo',
        interestsError: 'Seleccione al menos un interés',
        emailLabel: 'Correo electrónico',
        nameLabel: 'Nombre completo',
        interestsLegend: 'Seleccione sus intereses',
        checkboxes: [
          { label: 'Reducción del riesgo de desastres', value: 'drr' },
          { label: 'Cambio climático', value: 'climate' },
        ],
      };
    case 'french':
      return {
        title: 'Il y a un problème',
        emailError: 'Saisissez une adresse e-mail valide',
        nameError: 'Saisissez votre nom complet',
        interestsError: "Sélectionnez au moins un centre d'intérêt",
        emailLabel: 'Adresse e-mail',
        nameLabel: 'Nom complet',
        interestsLegend: "Sélectionnez vos centres d'intérêt",
        checkboxes: [
          { label: 'Réduction des risques de catastrophe', value: 'drr' },
          { label: 'Changement climatique', value: 'climate' },
        ],
      };
    case 'chinese':
      return {
        title: '存在问题',
        emailError: '请输入有效的电子邮件地址',
        nameError: '请输入您的全名',
        interestsError: '请至少选择一项兴趣',
        emailLabel: '电子邮件地址',
        nameLabel: '全名',
        interestsLegend: '选择您的兴趣',
        checkboxes: [
          { label: '减少灾害风险', value: 'drr' },
          { label: '气候变化', value: 'climate' },
        ],
      };
    case 'russian':
      return {
        title: 'Есть проблема',
        emailError: 'Введите действительный адрес электронной почты',
        nameError: 'Введите своё полное имя',
        interestsError: 'Выберите хотя бы один интерес',
        emailLabel: 'Адрес электронной почты',
        nameLabel: 'Полное имя',
        interestsLegend: 'Выберите ваши интересы',
        checkboxes: [
          { label: 'Снижение риска бедствий', value: 'drr' },
          { label: 'Изменение климата', value: 'climate' },
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
