import React from 'react';
import { Icon } from './Icon';
import data from './Icons.json';

export default {
  title: 'Components/Icons',
  component: Icon,
  parameters: {
    viewMode: 'docs',
    previewTabs: {
      canvas: {
        hidden: true,
      },
    },
  },
};

const sourceBadgeStyle = {
  lucide: { backgroundColor: '#e8f4e8', color: '#2d6a2e' },
  ocha: { backgroundColor: '#e0eef8', color: '#1a5276' },
  custom: { backgroundColor: '#fef3e2', color: '#7a5d2b' },
};

const SourceBadge = ({ source }) => (
  <code
    style={{
      ...sourceBadgeStyle[source],
      padding: '2px 6px',
      borderRadius: '3px',
      fontSize: '0.75em',
      fontWeight: 600,
    }}
  >
    {source}
  </code>
);

const Template = args => (
  <div className="icons-container">
    {args.icons.map((item, index) => {
      const mgClass = `mg-icon mg-icon-${item.name}`;

      return (
        <p
          key={index}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <Icon name={item.name} />
          <span>
            {item.label}{' '}
            <code
              style={{
                backgroundColor: '#f0f0f0',
                padding: '2px 6px',
                borderRadius: '3px',
              }}
            >
              {mgClass}
            </code>{' '}
            {item.source && <SourceBadge source={item.source} />}
          </span>
        </p>
      );
    })}
  </div>
);

export const DefaultIcons = {
  render: Template,
  args: {
    icons: data.icons,
  },
  name: 'Icons',
  parameters: {
    docs: {
      source: {
        code: `// Preferred format
<Icon name="globe" />
// Renders: <span class="mg-icon mg-icon-globe" aria-hidden="true"></span>

// Legacy format (still supported via font fallback)
<Icon name="fa-globe" />
// Renders: <span class="mg-icon fa-globe" aria-hidden="true"></span>

// Direct CSS usage
<span class="mg-icon mg-icon-globe"></span>`,
      },
    },
  },
};

// Single icon example
export const SingleIcon = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div>
        <Icon name="globe" size="lg" />
        <p>
          <code>{'<Icon name="globe" size="lg" />'}</code>
        </p>
      </div>
      <div>
        <Icon name="chart-bar" />
        <p>
          <code>{'<Icon name="chart-bar" />'}</code>
        </p>
      </div>
      <div>
        <Icon name="earthquake" />
        <p>
          <code>{'<Icon name="earthquake" />'}</code> (OCHA)
        </p>
      </div>
    </div>
  ),
  name: 'Icon component',
};

// Color utilities and inheritance demo
export const ColoredIcons = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h4 style={{ margin: '0 0 0.5rem' }}>
          Color utilities (<code>mg-u-color--*</code>)
        </h4>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem' }}>
          Icons inherit <code>color</code>, so the existing{' '}
          <code>mg-u-color--*</code> utility classes work directly.
        </p>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Icon name="globe" size="xl" className="mg-u-color--interactive" />
            <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
              <code>mg-u-color--interactive</code>
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Icon
              name="search"
              size="xl"
              className="mg-u-color--interactive-active"
            />
            <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
              <code>mg-u-color--interactive-active</code>
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Icon
              name="exclamation-triangle"
              size="xl"
              className="mg-u-color--red-800"
            />
            <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
              <code>mg-u-color--red-800</code>
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Icon name="times" size="xl" className="mg-u-color--neutral-500" />
            <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
              <code>mg-u-color--neutral-500</code>
            </p>
          </div>
          <div
            style={{
              textAlign: 'center',
              backgroundColor: '#333',
              padding: '0.5rem',
              borderRadius: '4px',
            }}
          >
            <Icon name="power-off" size="xl" className="mg-u-color--white" />
            <p
              style={{
                fontSize: '0.75rem',
                margin: '0.25rem 0 0',
                color: '#fff',
              }}
            >
              <code>mg-u-color--white</code>
            </p>
          </div>
        </div>
      </div>
      <div>
        <h4 style={{ margin: '0 0 0.5rem' }}>Inherited from parent</h4>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem' }}>
          Icons inside a colored parent inherit that color automatically.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div
            className="mg-u-color--interactive"
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <Icon name="globe" size="lg" />
            <Icon name="search" size="lg" />
            <Icon name="calendar-alt" size="lg" />
            <span style={{ fontSize: '0.75rem' }}>
              <code>mg-u-color--interactive</code> on parent
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span
              className="mg-tag"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Icon name="tags" /> Tag color
            </span>
            <a
              href="#"
              className="mg-cta"
              onClick={e => e.preventDefault()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Icon name="link" /> Link color
            </a>
          </div>
        </div>
      </div>
      <div>
        <h4 style={{ margin: '0 0 0.5rem' }}>Inline style</h4>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem' }}>
          For one-off colors (e.g. brand logos), use inline styles.
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Icon name="facebook" size="xl" style={{ color: '#1877f2' }} />
          <Icon name="linkedin" size="xl" style={{ color: '#0a66c2' }} />
          <Icon name="youtube" size="xl" style={{ color: '#ff0000' }} />
          <Icon name="x-social" size="xl" style={{ color: '#000' }} />
          <Icon name="earthquake" size="xl" style={{ color: '#e4710b' }} />
        </div>
      </div>
    </div>
  ),
  name: 'Colored icons',
};
