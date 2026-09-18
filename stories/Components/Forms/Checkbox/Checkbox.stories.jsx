import React from 'react';
import { Checkbox } from './Checkbox';
import { FormGroup } from '../FormGroup/FormGroup';
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
