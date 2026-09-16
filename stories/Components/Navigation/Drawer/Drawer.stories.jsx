import React, { useState } from 'react';
import { Drawer } from './Drawer';
import {
  DEFAULT_DRAWER_LABELS,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_ZH,
  LABELS_AR,
  LABELS_RU,
} from './_labels';

const LOCALE_LABELS = {
  spanish: LABELS_ES,
  french: LABELS_FR,
  japanese: LABELS_JA,
  chinese: LABELS_ZH,
  arabic: LABELS_AR,
  russian: LABELS_RU,
};

const DrawerDemo = args => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="mg-button mg-button-primary"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
      >
        Open drawer
      </button>
      <Drawer {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <p>Drawer content goes here.</p>
        <a href="#example">An example link</a>
      </Drawer>
    </>
  );
};

export default {
  title: 'Components/Navigation/Drawer',
  component: Drawer,
  decorators: [
    (Story, context) => (
      <Story
        args={{
          ...context.args,
          labels:
            LOCALE_LABELS[context.globals?.locale] || DEFAULT_DRAWER_LABELS,
        }}
      />
    ),
  ],
  argTypes: {
    position: { control: 'inline-radio', options: ['start', 'end', 'bottom'] },
  },
};

export const Default = {
  render: args => <DrawerDemo {...args} />,
  args: {
    title: 'Filter options',
    position: 'start',
    backdrop: true,
  },
};

export const End = {
  render: args => <DrawerDemo {...args} />,
  args: {
    title: 'Settings',
    position: 'end',
  },
};
