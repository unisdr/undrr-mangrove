import React, { useCallback, useState } from 'react';
import { FormErrorSummary } from '../FormErrorSummary/FormErrorSummary';
import { TextInput } from '../TextInput/TextInput';
import { Textarea } from '../Textarea/Textarea';
import { Select } from '../Select/Select';
import { FormGroup } from '../FormGroup/FormGroup';
import { Checkbox } from '../Checkbox/Checkbox';
import Snackbar from '../../Snackbar/Snackbar';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        summaryTitle: 'هناك مشكلة',
        nameLabel: 'الاسم الكامل',
        namePlaceholder: 'أدخل اسمك الكامل',
        nameError: 'أدخل اسمك الكامل',
        emailLabel: 'البريد الإلكتروني',
        emailPlaceholder: 'أدخل بريدك الإلكتروني',
        emailError: 'أدخل عنوان بريد إلكتروني صالح',
        categoryLabel: 'فئة',
        categoryPlaceholder: 'اختر فئة',
        categoryError: 'اختر فئة',
        categoryOptions: [
          { value: 'general', label: 'استفسار عام' },
          { value: 'technical', label: 'دعم فني' },
          { value: 'feedback', label: 'ملاحظات' },
        ],
        messageLabel: 'الرسالة',
        messagePlaceholder: 'أدخل رسالتك',
        messageError: 'أدخل رسالتك',
        interestsLegend: 'الاهتمامات',
        interestsError: 'اختر اهتمامًا واحدًا على الأقل',
        checkboxes: [
          { label: 'الحد من مخاطر الكوارث', value: 'drr' },
          { label: 'تغير المناخ', value: 'climate' },
          { label: 'التنمية المستدامة', value: 'sdg' },
        ],
        submitLabel: 'إرسال',
        successMessage: 'تم إرسال النموذج بنجاح.',
      };
    case 'japanese':
      return {
        summaryTitle: '問題があります',
        nameLabel: '氏名',
        namePlaceholder: '氏名を入力',
        nameError: '氏名を入力してください',
        emailLabel: 'メールアドレス',
        emailPlaceholder: 'メールアドレスを入力',
        emailError: '有効なメールアドレスを入力してください',
        categoryLabel: 'カテゴリー',
        categoryPlaceholder: 'カテゴリーを選択',
        categoryError: 'カテゴリーを選択してください',
        categoryOptions: [
          { value: 'general', label: '一般的なお問い合わせ' },
          { value: 'technical', label: '技術サポート' },
          { value: 'feedback', label: 'フィードバック' },
        ],
        messageLabel: 'メッセージ',
        messagePlaceholder: 'メッセージを入力',
        messageError: 'メッセージを入力してください',
        interestsLegend: '関心分野',
        interestsError: '少なくとも1つの関心分野を選択してください',
        checkboxes: [
          { label: '防災・減災', value: 'drr' },
          { label: '気候変動', value: 'climate' },
          { label: '持続可能な開発', value: 'sdg' },
        ],
        submitLabel: '送信',
        successMessage: 'フォームが正常に送信されました。',
      };
    default:
      return {
        summaryTitle: 'There is a problem',
        nameLabel: 'Full name',
        namePlaceholder: 'Enter your full name',
        nameError: 'Enter your full name',
        emailLabel: 'Email address',
        emailPlaceholder: 'Enter your email address',
        emailError: 'Enter a valid email address',
        categoryLabel: 'Category',
        categoryPlaceholder: 'Select a category',
        categoryError: 'Select a category',
        categoryOptions: [
          { value: 'general', label: 'General inquiry' },
          { value: 'technical', label: 'Technical support' },
          { value: 'feedback', label: 'Feedback' },
        ],
        messageLabel: 'Message',
        messagePlaceholder: 'Enter your message',
        messageError: 'Enter your message',
        interestsLegend: 'Interests',
        interestsError: 'Select at least one interest',
        checkboxes: [
          { label: 'Disaster risk reduction', value: 'drr' },
          { label: 'Climate change', value: 'climate' },
          { label: 'Sustainable development', value: 'sdg' },
        ],
        submitLabel: 'Submit',
        successMessage: 'Form submitted successfully.',
      };
  }
};

function FormValidationDemo({ locale, errorDisplay = 'block' }) {
  const caption = getCaptionForLocale(locale);

  const [values, setValues] = useState({
    name: '',
    email: '',
    category: '',
    message: '',
    interests: [],
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const closeToast = useCallback(() => setToastOpen(false), []);

  const fieldErrors = Object.entries(errors).map(([id, message]) => ({
    id,
    message,
  }));

  const validate = () => {
    const next = {};

    if (!values.name.trim()) {
      next.name = caption.nameError;
    }
    const emailEl = document.getElementById('email');
    if (!values.email.trim() || (emailEl && !emailEl.checkValidity())) {
      next.email = caption.emailError;
    }
    if (!values.category) {
      next.category = caption.categoryError;
    }
    if (!values.message.trim()) {
      next.message = caption.messageError;
    }
    if (values.interests.length === 0) {
      next.interests = caption.interestsError;
    }

    return next;
  };

  const clearError = field => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleChange = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Live-validate email using native type="email" check; clear other fields immediately
    if (field === 'email') {
      const emailEl = document.getElementById('email');
      const isInvalid = value.trim() && emailEl && !emailEl.checkValidity();
      if (isInvalid && !errors.email) {
        setErrors(prev => ({ ...prev, email: caption.emailError }));
      } else if (!isInvalid && errors.email) {
        clearError('email');
      }
    } else {
      clearError(field);
    }

    if (submitted) setSubmitted(false);
  };

  const handleCheckbox = (value, checked) => {
    setValues(prev => {
      const interests = checked
        ? [...prev.interests, value]
        : prev.interests.filter(v => v !== value);
      return { ...prev, interests };
    });
    clearError('interests');
    if (submitted) setSubmitted(false);
  };

  const handleSubmit = e => {
    e.preventDefault();
    setToastOpen(false);
    const next = validate();

    if (Object.keys(next).length > 0) {
      setErrors(next);
      setSubmitted(false);

      if (errorDisplay === 'toast') {
        const messages = Object.values(next);
        setToastMessage(messages.join(' · '));
        setToastOpen(true);
      }
      return;
    }

    setErrors({});
    setSubmitted(true);
    setValues({
      name: '',
      email: '',
      category: '',
      message: '',
      interests: [],
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        {errorDisplay === 'block' && (
          <FormErrorSummary title={caption.summaryTitle} errors={fieldErrors} />
        )}

        <TextInput
          id="name"
          label={caption.nameLabel}
          placeholder={caption.namePlaceholder}
          value={values.name}
          onChange={e => handleChange('name', e.target.value)}
          required
          error={!!errors.name}
          errorText={errors.name}
        />

        <TextInput
          id="email"
          label={caption.emailLabel}
          type="email"
          placeholder={caption.emailPlaceholder}
          value={values.email}
          onChange={e => handleChange('email', e.target.value)}
          required
          error={!!errors.email}
          errorText={errors.email}
        />

        <Select
          id="category"
          label={caption.categoryLabel}
          placeholder={caption.categoryPlaceholder}
          options={caption.categoryOptions}
          value={values.category}
          onChange={e => handleChange('category', e.target.value)}
          required
          error={!!errors.category}
          errorText={errors.category}
        />

        <Textarea
          id="message"
          label={caption.messageLabel}
          placeholder={caption.messagePlaceholder}
          value={values.message}
          onChange={e => handleChange('message', e.target.value)}
          required
          error={!!errors.message}
          errorText={errors.message}
        />

        <FormGroup
          legend={caption.interestsLegend}
          error={!!errors.interests}
          errorText={errors.interests}
        >
          {caption.checkboxes.map((item, index) => (
            <Checkbox
              key={item.value}
              id={index === 0 ? 'interests' : `interests-${item.value}`}
              label={item.label}
              value={item.value}
              name="interests"
              checked={values.interests.includes(item.value)}
              onChange={e => handleCheckbox(item.value, e.target.checked)}
            />
          ))}
        </FormGroup>

        <div className="mg-form-field">
          <button type="submit" className="mg-button mg-button-primary">
            {caption.submitLabel}
          </button>
        </div>

        {submitted && (
          <div className="mg-form-success" role="status">
            <p>{caption.successMessage}</p>
          </div>
        )}
      </form>

      <Snackbar
        severity="error"
        opened={toastOpen}
        message={toastMessage}
        onClose={closeToast}
        openedMiliseconds={6000}
      />
    </>
  );
}

export default {
  title: 'Example/Form validation',
  argTypes: {
    errorDisplay: {
      control: { type: 'radio' },
      options: ['block', 'toast'],
      description:
        'How validation errors are displayed: error summary block at top, or toast notification (Snackbar).',
    },
  },
};

export const Default = {
  args: {
    errorDisplay: 'block',
  },
  render: (args, { globals: { locale } }) => (
    <FormValidationDemo locale={locale} errorDisplay={args.errorDisplay} />
  ),
};
