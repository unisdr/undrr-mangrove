import React from 'react';
import { SegmentedControl } from './SegmentedControl';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        legend: 'طبقة الخريطة',
        options: [
          { label: 'العمق', value: 'depth' },
          { label: 'التكرار', value: 'frequency' },
          { label: 'التعرض', value: 'exposure' },
        ],
        unavailable: 'غير متاح',
      };
    case 'japanese':
      return {
        legend: '地図レイヤー',
        options: [
          { label: '深さ', value: 'depth' },
          { label: '頻度', value: 'frequency' },
          { label: '暴露', value: 'exposure' },
        ],
        unavailable: '利用不可',
      };
    default:
      return {
        legend: 'Map layer',
        options: [
          { label: 'Depth', value: 'depth' },
          { label: 'Frequency', value: 'frequency' },
          { label: 'Exposure', value: 'exposure' },
        ],
        unavailable: 'Unavailable',
      };
  }
};

export default {
  title: 'Components/Forms/Segmented control',
  component: SegmentedControl,
};

export const Default = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <SegmentedControl
        legend={caption.legend}
        name="layer"
        options={caption.options}
        defaultValue="depth"
        {...args}
      />
    );
  },
};

export const HiddenLegend = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <SegmentedControl
        legend={caption.legend}
        name="layer-hidden-legend"
        options={caption.options}
        defaultValue="frequency"
        hideLegend
        {...args}
      />
    );
  },
};

// A view switcher is often rendered before the user has chosen anything, and
// the keyboard behaves differently there: the group still takes one tab stop,
// it lands on the first segment, and arriving does not select it.
export const NoSelection = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <SegmentedControl
        legend={caption.legend}
        name="layer-no-selection"
        options={caption.options}
        {...args}
      />
    );
  },
};

export const Small = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <SegmentedControl
        legend={caption.legend}
        name="layer-small"
        options={caption.options}
        defaultValue="depth"
        size="small"
        {...args}
      />
    );
  },
};

export const FullWidth = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <SegmentedControl
        legend={caption.legend}
        name="layer-full-width"
        options={caption.options}
        defaultValue="exposure"
        fullWidth
        {...args}
      />
    );
  },
};

export const WithDisabledSegment = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const options = caption.options.map((option, index) =>
      index === 2
        ? {
            ...option,
            label: `${option.label} (${caption.unavailable})`,
            disabled: true,
          }
        : option
    );
    return (
      <SegmentedControl
        legend={caption.legend}
        name="layer-disabled"
        options={options}
        defaultValue="depth"
        {...args}
      />
    );
  },
};

function ControlledExample({ caption, ...args }) {
  const [layer, setLayer] = React.useState('depth');
  return (
    <>
      <SegmentedControl
        legend={caption.legend}
        name="layer-controlled"
        options={caption.options}
        value={layer}
        onChange={event => setLayer(event.target.value)}
        {...args}
      />
      <p aria-live="polite">Showing: {layer}</p>
    </>
  );
}

export const Controlled = {
  render: (args, { globals: { locale } }) => (
    <ControlledExample caption={getCaptionForLocale(locale)} {...args} />
  ),
};
