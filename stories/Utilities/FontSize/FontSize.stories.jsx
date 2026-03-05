import React from 'react';

export default {
  title: 'Components/Font size utilities',
  parameters: {
    docs: {
      description: {
        component:
          'Font size utility classes that apply Mangrove design tokens with responsive scaling. Base size applies on mobile; scales up at the medium breakpoint (48em).',
      },
    },
  },
};

const sizes = [
  {
    className: 'mg-u-font-size-300',
    label: '300',
    description: '1.6rem (no responsive scaling)',
  },
  {
    className: 'mg-u-font-size-400',
    label: '400',
    description: '1.6rem / 1.8rem at medium',
  },
  {
    className: 'mg-u-font-size-500',
    label: '500',
    description: '1.8rem / 2.3rem at medium',
  },
  {
    className: 'mg-u-font-size-600',
    label: '600',
    description: '2.3rem / 3.2rem at medium',
  },
  {
    className: 'mg-u-font-size-800',
    label: '800',
    description: '3.2rem / 3.6rem at medium',
  },
  {
    className: 'mg-u-font-size-900',
    label: '900',
    description: '3.6rem / 4rem at medium',
  },
];

export const AllSizes = () => (
  <div>
    <h4>Font size utility classes</h4>
    <p>
      Resize your browser to see responsive scaling at the medium breakpoint
      (48em / 768px).
    </p>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        marginTop: '1.5rem',
      }}
    >
      {sizes.map(({ className, label, description }) => (
        <div key={label}>
          <code
            style={{
              display: 'block',
              marginBottom: '0.25rem',
              fontSize: '0.85rem',
              color: '#666',
            }}
          >
            .{className} — {description}
          </code>
          <p className={className} style={{ margin: 0 }}>
            The quick brown fox jumps over the lazy dog
          </p>
        </div>
      ))}
    </div>
  </div>
);

AllSizes.storyName = 'All font sizes';

export const OnHeadings = () => (
  <div>
    <h4>Font size utilities on headings</h4>
    <p>
      These classes can be applied to any element, including headings, to
      override the default font size.
    </p>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginTop: '1.5rem',
      }}
    >
      <h2 className="mg-u-font-size-900" style={{ margin: 0 }}>
        Heading with font-size-900
      </h2>
      <h3 className="mg-u-font-size-600" style={{ margin: 0 }}>
        Heading with font-size-600
      </h3>
      <h4 className="mg-u-font-size-400" style={{ margin: 0 }}>
        Heading with font-size-400
      </h4>
    </div>
  </div>
);

OnHeadings.storyName = 'Applied to headings';
