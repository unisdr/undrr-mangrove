import { withLanguage } from '../../../.storybook/withLanguage';
import { ServiceNotice } from './ServiceNotice';

const meta = {
  title: 'Components/Notice/Service notice',
  component: ServiceNotice,
  decorators: [withLanguage],
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    status: {
      options: ['degraded', 'offline'],
      control: { type: 'inline-radio' },
    },
    isCompact: { control: 'boolean' },
    isOverlay: { control: 'boolean' },
    headingLevel: {
      control: 'select',
      options: ['h2', 'h3', 'h4', 'h5', 'h6'],
    },
    countdownSeconds: { control: 'number' },
    maxAutoRetries: { control: 'number' },
  },
};

export default meta;

export const Degraded = {
  args: {
    title: 'MapX layer service experiencing high latency',
    description:
      'Geospatial tiles may take longer than usual to render. Cached data remains available.',
    status: 'degraded',
    onRetry: () => {},
    statusUrl: 'https://messaging.undrr.org/',
  },
};

export const Offline = {
  args: {
    title: 'Hazard analysis API currently unreachable',
    description:
      'The remote service returned 503 Service Unavailable. Inspection tools and data layers are temporarily disabled.',
    status: 'offline',
    onRetry: () => {},
    statusUrl: 'https://messaging.undrr.org/',
    countdownSeconds: 15,
    maxAutoRetries: 3,
  },
};

export const EmbedOverlay = {
  render: args => (
    <div
      style={{
        position: 'relative',
        height: '320px',
        width: '100%',
        maxWidth: '600px',
        marginInline: 'auto',
        backgroundColor: '#e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ color: '#9ca3af', fontWeight: 600 }}>
        [Embedded Map Canvas]
      </div>
      <ServiceNotice {...args} />
    </div>
  ),
  args: {
    title: 'Map service temporarily unavailable',
    description:
      'Unable to connect to the tile server. Check your network or retry below.',
    status: 'offline',
    isOverlay: true,
    onRetry: () => {},
    statusUrl: 'https://messaging.undrr.org/',
  },
};
