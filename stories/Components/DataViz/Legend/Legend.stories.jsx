import React from 'react';
import { Legend } from './Legend';

export default {
  title: 'Components/DataViz/Legend',
  component: Legend,
  argTypes: {
    type: {
      control: 'select',
      options: ['continuous', 'categorical', 'stepped'],
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    layout: {
      control: 'select',
      options: ['default', 'inline', 'grid'],
    },
  },
};

export const Continuous = {
  args: {
    title: 'Peak Ground Acceleration (PGA)',
    type: 'continuous',
    customRamp: 'linear-gradient(to right, #00f, #0ff, #0f0, #ff0, #f00)',
    ticks: [
      { label: '0 cm/s²', position: '0%' },
      { label: '500', position: '50%' },
      { label: '> 1000', position: '100%' },
    ],
  },
};

export const Categorical = {
  args: {
    title: 'Disaster Type',
    type: 'categorical',
    layout: 'inline',
    items: [
      {
        label: 'Earthquake',
        color: 'rgb(var(--mg-color-red-500))',
        value: '45%',
      },
      { label: 'Flood', color: 'rgb(var(--mg-color-blue-500))', value: '30%' },
      {
        label: 'Drought',
        color: 'rgb(var(--mg-color-orange-500))',
        value: '25%',
      },
    ],
  },
};

export const Stepped = {
  args: {
    title: 'Temperature Anomalies (°C)',
    type: 'stepped',
    items: [
      { color: '#313695' },
      { color: '#4575b4' },
      { color: '#74add1' },
      { color: '#abd9e9' },
      { color: '#e0f3f8' },
      { color: '#fee090' },
      { color: '#fdae61' },
      { color: '#f46d43' },
      { color: '#d73027' },
      { color: '#a50026' },
    ],
    ticks: [
      { label: '-5', position: '0%' },
      { label: '0', position: '50%' },
      { label: '+5', position: '100%' },
    ],
  },
};

export const VerticalContinuous = {
  args: {
    ...Continuous.args,
    orientation: 'vertical',
    customRamp: 'linear-gradient(to bottom, #f00, #ff0, #0f0, #0ff, #00f)',
  },
};

export const CategoricalGrid = {
  args: {
    ...Categorical.args,
    layout: 'grid',
  },
};

export const DarkTheme = {
  args: {
    ...Categorical.args,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    themes: {
      themeOverride: 'Dark',
    },
  },
  decorators: [
    Story => (
      <div
        className="mg-theme-dark"
        style={{
          padding: '2rem',
          backgroundColor: 'rgb(var(--mg-color-background))',
          color: 'rgb(var(--mg-color-neutral-900))',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
