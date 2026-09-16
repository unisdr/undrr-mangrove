import { Range } from './Range';
import { FormGroup } from '../FormGroup/FormGroup';
import React, { useState } from 'react';

const meta = {
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

export default meta;

export const Continuous = {
  render: args => {
    const [val, setVal] = useState(args.defaultValue || 50);
    return (
      <FormGroup label="Range Example" id={args.id}>
        <Range {...args} value={val} onChange={e => setVal(e.target.value)} />
        <div
          style={{
            marginTop: '1rem',
            fontSize: '14px',
            color: 'rgb(var(--mg-color-neutral-600))',
          }}
        >
          Selected value: {val}
        </div>
      </FormGroup>
    );
  },
  args: {
    id: 'range-continuous',
    name: 'range_continuous',
    min: 0,
    max: 100,
    defaultValue: 50,
  },
};

export const Stepped = {
  render: args => {
    const [val, setVal] = useState(args.defaultValue || 1);
    return (
      <FormGroup label="Climate Targets" id={args.id}>
        <Range {...args} value={val} onChange={e => setVal(e.target.value)} />
        <div
          style={{
            marginTop: '1rem',
            fontSize: '14px',
            color: 'rgb(var(--mg-color-neutral-600))',
          }}
        >
          Selected value:{' '}
          {args.ticks.find(t => t.value.toString() === val.toString())?.label}
        </div>
      </FormGroup>
    );
  },
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
  render: args => {
    return (
      <FormGroup label="Disabled Range" id={args.id}>
        <Range {...args} />
      </FormGroup>
    );
  },
  args: {
    id: 'range-disabled',
    name: 'range_disabled',
    min: 0,
    max: 100,
    defaultValue: 50,
    disabled: true,
  },
};
