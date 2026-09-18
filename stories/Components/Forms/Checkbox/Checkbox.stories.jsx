import React from 'react';
import { Checkbox } from './Checkbox';
import { FormGroup } from '../FormGroup/FormGroup';
import { TextInput } from '../TextInput/TextInput';
import {
  getSwitchCaptionForLocale,
  PendingSwitchDemo,
  PendingSwitchRow,
  simulateSave,
} from './_switchPending';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        label: 'أوافق على الشروط والأحكام',
        value: 'terms',
        legend: 'اختر اهتماماتك',
        items: [
          { label: 'الحد من مخاطر الكوارث', value: 'drr' },
          { label: 'تغير المناخ', value: 'climate' },
          { label: 'المرونة', value: 'resilience' },
        ],
        errorText: 'يجب عليك قبول الشروط والأحكام',
      };
    case 'japanese':
      return {
        label: '利用規約に同意する',
        value: 'terms',
        legend: '興味のある分野を選択',
        items: [
          { label: '防災・減災', value: 'drr' },
          { label: '気候変動', value: 'climate' },
          { label: 'レジリエンス', value: 'resilience' },
        ],
        errorText: '利用規約に同意する必要があります',
      };
    default:
      return {
        label: 'Accept terms and conditions',
        value: 'terms',
        legend: 'Select your interests',
        items: [
          { label: 'Disaster risk reduction', value: 'drr' },
          { label: 'Climate change', value: 'climate' },
          { label: 'Resilience', value: 'resilience' },
        ],
        errorText: 'You must accept the terms and conditions',
      };
  }
};

// Captions for the switch error and size stories. Kept here rather than in
// _switchPending, which serves the pending stories only.
const getSwitchStateCaption = locale => {
  switch (locale) {
    case 'arabic':
      return {
        errorLabel: 'طبقة الخطر الزلزالي',
        errorText: 'تعذّر تحميل هذه الطبقة. حاول مرة أخرى.',
        inputLabel: 'نصف قطر المنطقة (كم)',
        inputError: 'أدخل رقمًا بين 1 و500.',
        defaultSize: 'الحجم الافتراضي',
        smallSize: 'الحجم الصغير',
        customSize: 'حجم مخصص',
      };
    case 'japanese':
      return {
        errorLabel: '地震ハザードレイヤー',
        errorText:
          'このレイヤーを読み込めませんでした。もう一度お試しください。',
        inputLabel: '範囲の半径 (km)',
        inputError: '1 から 500 の数値を入力してください。',
        defaultSize: '標準サイズ',
        smallSize: '小サイズ',
        customSize: 'カスタムサイズ',
      };
    default:
      return {
        errorLabel: 'Seismic hazard layer',
        errorText: 'This layer could not load. Try again.',
        inputLabel: 'Area radius (km)',
        inputError: 'Enter a number between 1 and 500.',
        defaultSize: 'Default size',
        smallSize: 'Small size',
        customSize: 'Custom size',
      };
  }
};

const switchMarkup = ({ id, label, className = 'mg-switch', ...input }) => (
  <label className={className}>
    <input
      type="checkbox"
      role="switch"
      className="mg-switch__input"
      id={id}
      {...input}
    />
    <span className="mg-switch__track" aria-hidden="true">
      <span className="mg-switch__thumb"></span>
    </span>
    <span className="mg-switch__label">{label}</span>
  </label>
);

export default {
  title: 'Components/Forms/Checkbox',
  component: Checkbox,
};

export const Default = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Checkbox label={caption.label} value={caption.value} {...args} />;
  },
};

export const Checked = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Checkbox
        label={caption.label}
        value={caption.value}
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
      <Checkbox
        label={caption.label}
        value={caption.value}
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
      <Checkbox
        label={caption.label}
        value={caption.value}
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
      <Checkbox
        label={caption.label}
        value={caption.value}
        error
        errorText={caption.errorText}
        {...args}
      />
    );
  },
};

export const CheckboxGroup = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <FormGroup legend={caption.legend}>
        {caption.items.map(item => (
          <Checkbox
            key={item.value}
            label={item.label}
            value={item.value}
            name="interests"
            {...args}
          />
        ))}
      </FormGroup>
    );
  },
};

export const Switch = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <label className="mg-switch">
        <input type="checkbox" role="switch" className="mg-switch__input" />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">Active map layer</span>
      </label>
      <label className="mg-switch">
        <input
          type="checkbox"
          role="switch"
          className="mg-switch__input"
          defaultChecked
        />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">Real-time alerts enabled</span>
      </label>
    </div>
  ),
  name: 'Switch toggle',
};

export const SwitchDisabled = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <label className="mg-switch">
        <input
          type="checkbox"
          role="switch"
          className="mg-switch__input"
          disabled
        />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">Unavailable layer</span>
      </label>
      <label className="mg-switch">
        <input
          type="checkbox"
          role="switch"
          className="mg-switch__input"
          defaultChecked
          disabled
        />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">Locked active layer</span>
      </label>
    </div>
  ),
  name: 'Switch disabled',
};

export const SwitchError = {
  render: (args, { globals: { locale } }) => {
    const caption = getSwitchStateCaption(locale);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          {switchMarkup({
            id: 'switch-error-demo',
            label: caption.errorLabel,
            defaultChecked: true,
            'aria-invalid': 'true',
            'aria-describedby': 'switch-error-demo-error',
          })}
          <p
            className="mg-form-error"
            id="switch-error-demo-error"
            role="alert"
          >
            {caption.errorText}
          </p>
        </div>

        {/* The same error treatment on a text input, for comparison. */}
        <TextInput
          label={caption.inputLabel}
          defaultValue="900"
          error
          errorText={caption.inputError}
        />
      </div>
    );
  },
  name: 'Switch error',
};

export const SwitchSizes = {
  render: (args, { globals: { locale } }) => {
    const caption = getSwitchStateCaption(locale);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {switchMarkup({
          id: 'switch-size-default',
          label: caption.defaultSize,
          defaultChecked: true,
        })}
        {switchMarkup({
          id: 'switch-size-small',
          label: caption.smallSize,
          className: 'mg-switch mg-switch--small',
          defaultChecked: true,
        })}
        <span style={{ '--mg-switch-size': '2.25rem' }}>
          {switchMarkup({
            id: 'switch-size-custom',
            label: caption.customSize,
            defaultChecked: true,
          })}
        </span>
      </div>
    );
  },
  name: 'Switch sizes',
};

export const SwitchPending = {
  render: (args, { globals: { locale } }) => {
    const caption = getSwitchCaptionForLocale(locale);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <PendingSwitchRow
          label={caption.layerLabel}
          note={caption.turningOn}
          checked
        />
        <PendingSwitchRow
          label={caption.alertsLabel}
          note={caption.turningOff}
        />
      </div>
    );
  },
  name: 'Switch pending',
};

export const SwitchPendingInteractive = {
  args: { outcome: 'success', timeoutMs: 5000, revert: true },
  argTypes: {
    outcome: {
      control: 'radio',
      options: ['success', 'failure', 'timeout'],
      description:
        'How the simulated save ends. `timeout` never responds, so the deadline settles it.',
    },
    timeoutMs: {
      control: 'radio',
      options: [5000, 0],
      labels: { 5000: '5 seconds', 0: 'No deadline' },
      description:
        'The `timeout` option. `0` switches the deadline off, so only the save can settle the switch: with `outcome` set to `timeout` it stays busy, and says it is still saving after 10 seconds.',
    },
    revert: {
      control: 'boolean',
      description:
        'The `revert` option. Off keeps the position the user asked for when a save fails and sets `aria-invalid="true"` instead of moving the switch back.',
    },
  },
  render: ({ outcome, timeoutMs, revert }, { globals: { locale } }) => (
    <PendingSwitchDemo
      caption={getSwitchCaptionForLocale(locale)}
      save={simulateSave(outcome)}
      timeoutMs={timeoutMs}
      revert={revert}
    />
  ),
  name: 'Switch pending, interactive',
};
