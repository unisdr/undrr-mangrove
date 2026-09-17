import React, { useState } from 'react';
import { Drawer } from './Drawer';
import { Checkbox } from '../../Forms/Checkbox/Checkbox';
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

const HAZARDS = [
  'Drought',
  'Earthquake',
  'Flood',
  'Heatwave',
  'Tropical cyclone',
];

const MAP_LAYERS = [
  'Flood extent',
  'Population density',
  'Critical infrastructure',
];

const toId = (prefix, label) =>
  `${prefix}-${label.toLowerCase().replace(/\s+/g, '-')}`;

const PublicationFilters = () => (
  <>
    <p>
      Narrow the publications list. Filters apply as soon as you select them.
    </p>
    <fieldset>
      <legend className="mg-form-label">Hazard</legend>
      {HAZARDS.map(hazard => (
        <Checkbox
          key={hazard}
          id={toId('drawer-hazard', hazard)}
          name="hazard"
          label={hazard}
          defaultChecked={hazard === 'Flood'}
        />
      ))}
    </fieldset>
    <p>
      <a href="#sendai-framework">About the Sendai Framework indicators</a>
    </p>
  </>
);

const PublicationFiltersFooter = ({ onClose }) => (
  <div className="mg-buttons">
    <button
      type="button"
      className="mg-button mg-button-primary"
      onClick={onClose}
    >
      Show 128 results
    </button>
    <button type="button" className="mg-button mg-button-secondary">
      Clear filters
    </button>
  </div>
);

const ReportDetails = () => (
  <>
    <p>
      Philippines submitted its latest Sendai Framework Monitor report in March
      2026, covering disaster losses for the 2025 reporting year.
    </p>
    <dl>
      <dt>Reporting focal point</dt>
      <dd>Office of Civil Defence</dd>
      <dt>Last updated</dt>
      <dd>12 March 2026</dd>
      <dt>Indicators reported</dt>
      <dd>31 of 38</dd>
    </dl>
    <p>
      <a href="#country-profile">Open the full country profile</a>
    </p>
  </>
);

const MapLayers = () => (
  <>
    <p>Choose the hazard layers drawn over the base map.</p>
    <fieldset>
      <legend className="mg-form-label">Layers</legend>
      {MAP_LAYERS.map(layer => (
        <Checkbox
          key={layer}
          id={toId('drawer-layer', layer)}
          name="layer"
          label={layer}
          defaultChecked={layer === 'Flood extent'}
        />
      ))}
    </fieldset>
  </>
);

/**
 * Trigger button plus drawer. The trigger owns the open state, which is what a
 * React parent does; hydrated drawers get the same behaviour from
 * `HydratedDrawer` and `data-mg-drawer-trigger`.
 */
const DrawerDemo = ({ args, triggerLabel, footer, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);
  return (
    <>
      <button
        type="button"
        className="mg-button mg-button-primary"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
      >
        {triggerLabel}
      </button>
      <Drawer
        {...args}
        isOpen={isOpen}
        onClose={close}
        footer={footer ? footer(close) : undefined}
      >
        {children}
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
  render: args => (
    <DrawerDemo
      args={args}
      triggerLabel="Filter publications"
      footer={close => <PublicationFiltersFooter onClose={close} />}
    >
      <PublicationFilters />
    </DrawerDemo>
  ),
  args: {
    title: 'Filter publications',
    position: 'start',
    backdrop: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A modal filter drawer on the inline start edge. The backdrop, focus trap and Escape dismissal come from the component; the trigger owns the open state.',
      },
    },
  },
};

export const End = {
  render: args => (
    <DrawerDemo args={args} triggerLabel="View report details">
      <ReportDetails />
    </DrawerDemo>
  ),
  args: {
    title: 'Philippines: report details',
    position: 'end',
  },
  parameters: {
    docs: {
      description: {
        story:
          '`start` and `end` follow text direction, so both swap sides in right-to-left layouts. Switch the locale toolbar to Arabic to see it.',
      },
    },
  },
};

export const Bottom = {
  render: args => (
    <DrawerDemo
      args={args}
      triggerLabel="Filter publications"
      footer={close => <PublicationFiltersFooter onClose={close} />}
    >
      <PublicationFilters />
    </DrawerDemo>
  ),
  args: {
    title: 'Filter publications',
    position: 'bottom',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A bottom sheet. Use it on narrow viewports, where a side drawer leaves too little room for the content.',
      },
    },
  },
};

export const FloatingPanel = {
  name: 'Floating panel',
  render: args => (
    <DrawerDemo args={args} triggerLabel="Map layers">
      <MapLayers />
    </DrawerDemo>
  ),
  args: {
    title: 'Map layers',
    position: 'end',
    isFloatingPanel: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A non-modal floating panel: no backdrop and no focus trap, so the page behind it stays usable. Use it for controls a reader adjusts while watching the page change.',
      },
    },
  },
};
