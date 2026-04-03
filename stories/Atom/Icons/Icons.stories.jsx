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
  custom: { backgroundColor: '#fef3e2', color: '#8a6d3b' },
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
