import { ServiceNotice } from './ServiceNotice';
import {
  DEFAULT_SERVICE_NOTICE_LABELS,
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

const withLocaleLabels = (Story, context) => {
  const labels =
    LOCALE_LABELS[context.globals?.locale] || DEFAULT_SERVICE_NOTICE_LABELS;
  return <Story {...context} args={{ ...context.args, labels }} />;
};

const meta = {
  title: 'Components/ServiceNotice',
  component: ServiceNotice,
  decorators: [withLocaleLabels],
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
    countdownSeconds: { control: 'number' },
  },
};

export default meta;

export const Degraded = {
  args: {
    title: 'MapX layer service experiencing high latency',
    description:
      'Geospatial tiles may take longer than usual to render. Cached data remains available.',
    status: 'degraded',
    onRetry: () => alert('Retrying connection...'),
    statusUrl: 'https://status.undrr.org',
  },
};

export const Offline = {
  args: {
    title: 'Hazard analysis API currently unreachable',
    description:
      'The remote service returned 503 Service Unavailable. Inspection tools and data layers are temporarily disabled.',
    status: 'offline',
    onRetry: () => alert('Retrying connection...'),
    statusUrl: 'https://status.undrr.org',
    countdownSeconds: 30,
  },
};

export const Compact = {
  args: {
    title: 'Feed connection degraded',
    description: 'Updates may be delayed by up to 5 minutes.',
    status: 'degraded',
    isCompact: true,
    onRetry: () => alert('Retrying connection...'),
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
    onRetry: () => alert('Retrying map connection...'),
    statusUrl: 'https://status.undrr.org',
  },
};
