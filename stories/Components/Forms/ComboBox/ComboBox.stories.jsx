import { useState } from 'react';
import ComboBox from './ComboBox';
import { Drawer } from '../../Navigation/Drawer/Drawer';
import '../../../assets/scss/aria/_combo-box.scss';

const hazards = [
  { id: 'cyclone', label: 'Tropical cyclone' },
  { id: 'drought', label: 'Drought' },
  { id: 'flood', label: 'Flood' },
];

export default {
  title: 'Components/Forms/ComboBox',
  component: ComboBox,
  args: {
    label: 'Hazard type',
    placeholder: 'Search hazards',
    items: hazards,
    openButtonLabel: 'Show suggested hazards',
  },
};

export const Default = {};

export const CustomValue = {
  args: { allowsCustomValue: true },
};

export const Invalid = {
  args: { error: true, errorText: 'Choose a hazard type.' },
};

export const Disabled = {
  args: { disabled: true },
};

export const InDrawer = {
  render: args => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open drawer
        </button>
        <Drawer
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Choose a hazard"
        >
          <ComboBox {...args} />
        </Drawer>
      </>
    );
  },
};

export const Controlled = {
  render: args => {
    const [inputValue, setInputValue] = useState('');
    return (
      <ComboBox
        {...args}
        inputValue={inputValue}
        onInputChange={setInputValue}
      />
    );
  },
};
