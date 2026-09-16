import React from 'react';
import { Notice } from './Notice';

const meta = {
  title: 'Components/Notice/Notice',
  component: Notice,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'warning', 'negative', 'positive'],
    },
    headingLevel: {
      control: 'select',
      options: ['h2', 'h3', 'h4', 'h5', 'h6'],
    },
    isCompact: { control: 'boolean' },
    isProminent: { control: 'boolean' },
    isOverlay: { control: 'boolean' },
    isDismissible: { control: 'boolean' },
  },
};

export default meta;

export const InfoNotice = {
  args: {
    variant: 'info',
    title: 'Scheduled maintenance update',
    description:
      'The PreventionWeb taxonomy service will undergo routine database indexing on Sunday between 02:00 and 04:00 UTC.',
  },
};

export const WarningBanner = {
  args: {
    variant: 'warning',
    title: 'Advisory: High latency on geospatial feeds',
    description:
      'Map tile requests may experience delayed responses due to upstream infrastructure maintenance.',
    actions: (
      <button type="button" className="mg-button mg-button-primary">
        Refresh feeds
      </button>
    ),
  },
};

export const NegativeAlert = {
  args: {
    variant: 'negative',
    title: 'Data synchronization failure',
    description:
      'Unable to connect to the central Sendai Framework monitoring registry. Changes have been saved locally in your browser.',
    actions: (
      <>
        <button type="button" className="mg-button mg-button-primary">
          Retry sync
        </button>
        <button
          type="button"
          className="mg-button mg-button-secondary mg-button-outline"
        >
          Export local backup
        </button>
      </>
    ),
  },
};

export const EmergencyBroadcast = {
  args: {
    variant: 'negative',
    isProminent: true,
    title: 'Flash Flood Warning: Coastal Region Sector 4',
    description:
      'Immediate evacuation recommended for low-lying areas. Follow instructions from local disaster management authorities.',
    actions: (
      <a
        href="https://undrr.org"
        target="_blank"
        rel="noopener noreferrer"
        className="mg-button mg-button-primary"
      >
        View emergency protocol
        <span
          className="mg-icon mg-icon-external-link mg-button__icon"
          aria-hidden="true"
        />
      </a>
    ),
  },
};

export const PositiveConfirmation = {
  args: {
    variant: 'positive',
    title: 'Report submitted',
    description:
      'Your voluntary national report has been received and queued for editorial review.',
  },
};

export const Dismissible = {
  args: {
    variant: 'info',
    isDismissible: true,
    title: 'New analytical dashboard features available',
    description:
      'Explore multi-hazard risk correlations with the updated 2026 data explorer.',
  },
};
