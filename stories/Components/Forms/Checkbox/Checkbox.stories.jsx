import React, { useEffect, useRef, useState } from 'react';
import { Checkbox } from './Checkbox';
import { FormGroup } from '../FormGroup/FormGroup';

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

const getSwitchCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        alertsLabel: 'تنبيهات فورية',
        layerLabel: 'طبقة الخريطة النشطة',
        turningOn: 'قيد التشغيل',
        turningOff: 'قيد الإيقاف',
        enabled: 'تم تفعيل التنبيهات الفورية',
        disabled: 'تم إيقاف التنبيهات الفورية',
        failed: 'تعذّر حفظ التغيير. حاول مرة أخرى.',
      };
    case 'japanese':
      return {
        alertsLabel: 'リアルタイム通知',
        layerLabel: '表示中の地図レイヤー',
        turningOn: 'オンに切り替え中',
        turningOff: 'オフに切り替え中',
        enabled: 'リアルタイム通知をオンにしました',
        disabled: 'リアルタイム通知をオフにしました',
        failed: '変更を保存できませんでした。もう一度お試しください。',
      };
    default:
      return {
        alertsLabel: 'Real-time alerts',
        layerLabel: 'Active map layer',
        turningOn: 'Turning on',
        turningOff: 'Turning off',
        enabled: 'Real-time alerts enabled',
        disabled: 'Real-time alerts turned off',
        failed: 'Could not save the change. Try again.',
      };
  }
};

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

export const SwitchPending = {
  render: (args, { globals: { locale } }) => {
    const caption = getSwitchCaptionForLocale(locale);
    const rows = [
      { label: caption.layerLabel, note: caption.turningOn, checked: true },
      { label: caption.alertsLabel, note: caption.turningOff, checked: false },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {rows.map(row => (
          <div key={row.label}>
            <label className="mg-switch">
              <input
                type="checkbox"
                role="switch"
                className="mg-switch__input"
                aria-busy="true"
                defaultChecked={row.checked}
              />
              <span className="mg-switch__track" aria-hidden="true">
                <span className="mg-switch__thumb"></span>
              </span>
              <span className="mg-switch__label">{row.label}</span>
            </label>
            <p className="mg-form-help">{row.note}</p>
          </div>
        ))}
      </div>
    );
  },
  name: 'Switch pending',
};

const PENDING_MS = 1500;

function PendingSwitchDemo({ simulateFailure, caption }) {
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleChange = event => {
    // Ignore further changes until the current request settles.
    if (pending) return;
    const requested = event.target.checked;
    setChecked(requested);
    setPending(true);
    setMessage('');
    timer.current = setTimeout(() => {
      setPending(false);
      if (simulateFailure) {
        setChecked(!requested);
        setMessage(caption.failed);
        return;
      }
      setMessage(requested ? caption.enabled : caption.disabled);
    }, PENDING_MS);
  };

  return (
    <div>
      <label className="mg-switch">
        <input
          type="checkbox"
          role="switch"
          className="mg-switch__input"
          checked={checked}
          aria-busy={pending}
          onChange={handleChange}
        />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">{caption.alertsLabel}</span>
      </label>
      <p className="mg-form-help" role="status">
        {message}
      </p>
    </div>
  );
}

export const SwitchPendingInteractive = {
  args: { simulateFailure: false },
  argTypes: {
    simulateFailure: {
      control: 'boolean',
      description: 'Fail the simulated request and revert the switch',
    },
  },
  render: ({ simulateFailure }, { globals: { locale } }) => (
    <PendingSwitchDemo
      simulateFailure={simulateFailure}
      caption={getSwitchCaptionForLocale(locale)}
    />
  ),
  name: 'Switch pending, interactive',
};
