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

// Define a Template function to streamline icon rendering
const Template = args => (
  <div className="icons-container">
    {args.icons.map((item, index) => {
      // Show both the new mg- format and legacy fa- format
      const mgClass = `mg-icon mg-${item.name}`;
      const faClass = `mg-icon fa-${item.name}`;

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
                backgroundColor: '#e8f4e8',
                padding: '2px 6px',
                borderRadius: '3px',
              }}
            >
              {mgClass}
            </code>{' '}
            <code
              style={{
                backgroundColor: '#f0f0f0',
                padding: '2px 6px',
                borderRadius: '3px',
                opacity: 0.7,
              }}
            >
              {faClass}
            </code>
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
        code: `// Preferred format (new)
<Icon name="globe" />
// Renders: <span class="mg-icon mg-globe" aria-hidden="true"></span>

// Legacy format (still supported)
<Icon name="fa-globe" />
// Renders: <span class="mg-icon fa-globe" aria-hidden="true"></span>

// Direct CSS usage
<span class="mg-icon mg-globe"></span>
<span class="mg-icon fa-globe"></span>  // legacy fallback`,
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
        <Icon name="fa-envelope" />
        <p>
          <code>{'<Icon name="fa-envelope" />'}</code> (legacy)
        </p>
      </div>
    </div>
  ),
  name: 'Icon Component',
};
