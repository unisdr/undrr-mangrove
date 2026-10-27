import React, { useState } from 'react';
import { Range } from './Range';

const RangeDemo = ({ label, ...args }) => {
  const [value, setValue] = useState(args.defaultValue ?? 0);
  const tickLabel = args.ticks?.find(
    tick => String(tick.value) === String(value)
  )?.label;
  return (
    <div>
      <label className="mg-form-label" htmlFor={args.id}>
        {label}
      </label>
      <Range
        {...args}
        defaultValue={undefined}
        value={value}
        onChange={event => setValue(event.target.value)}
      />
      <p aria-live="polite">Selected value: {tickLabel ?? value}</p>
    </div>
  );
};

export default {
  title: 'Components/Forms/Range',
  component: Range,
  tags: ['autodocs'],
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
  },
};

export const Continuous = {
  render: args => <RangeDemo label="Range example" {...args} />,
  args: {
    id: 'range-continuous',
    name: 'range_continuous',
    min: 0,
    max: 100,
    defaultValue: 50,
  },
};

export const Stepped = {
  render: args => <RangeDemo label="Climate targets" {...args} />,
  args: {
    id: 'range-stepped',
    name: 'range_stepped',
    min: 0,
    max: 3,
    step: 1,
    defaultValue: 1,
    ticks: [
      { value: 0, label: 'Historical' },
      { value: 1, label: '+1.5°C' },
      { value: 2, label: '+2°C' },
      { value: 3, label: '+3°C' },
    ],
  },
};

export const Disabled = {
  render: args => (
    <div>
      <label
        className="mg-form-label mg-form-label--disabled"
        htmlFor={args.id}
      >
        Disabled range
      </label>
      <Range {...args} />
    </div>
  ),
  args: {
    id: 'range-disabled',
    name: 'range_disabled',
    min: 0,
    max: 100,
    defaultValue: 50,
    disabled: true,
  },
};
