import React from 'react';
import sampleImage from '../../assets/images/sample_image-lg.jpg';

export default {
  title: 'Components/Utility CSS',
  parameters: {
    layout: 'padded',
  },
  tags: ['!autodocs'],
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '3rem' }}>
    <h2
      style={{
        borderBottom: '2px solid #e5e5e5',
        paddingBottom: '0.5rem',
        marginBottom: '1.5rem',
      }}
    >
      {title}
    </h2>
    {children}
  </div>
);

const DemoBox = ({ title, children }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    {title && (
      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#666' }}>
        {title}
      </h3>
    )}
    <div
      style={{
        border: '1px solid #e5e5e5',
        borderRadius: '6px',
        padding: '1.5rem',
        background: '#fff',
      }}
    >
      {children}
    </div>
  </div>
);

const InfoBox = ({ children }) => (
  <div
    style={{
      background: '#e8f4fc',
      padding: '1rem',
      borderRadius: '6px',
      marginBottom: '1rem',
      fontSize: '0.95rem',
    }}
  >
    {children}
  </div>
);

const CodeBlock = ({ children }) => (
  <pre
    style={{
      background: '#1e1e1e',
      color: '#d4d4d4',
      padding: '1rem',
      borderRadius: '6px',
      overflow: 'auto',
      fontSize: '0.85rem',
    }}
  >
    <code>{children}</code>
  </pre>
);

/**
 * Comprehensive utility classes reference with visual demonstrations.
 * Switch themes using the toolbar to see how utilities adapt to each theme.
 */
export const Cheatsheet = {
  render: () => (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Utility classes</h1>
      <p style={{ marginBottom: '1rem', color: '#666', fontSize: '1.1rem' }}>
        Mangrove provides utility classes for rapid UI development. These
        single-purpose classes let you build custom designs without writing
        custom CSS.
      </p>

      <Section title="Naming convention">
        <InfoBox>
          All utilities follow:{' '}
          <code
            style={{
              background: '#fff',
              padding: '0.2rem 0.4rem',
              borderRadius: '3px',
            }}
          >
            .mg-u-{'{property}'}-{'{value}'}
          </code>{' '}
          or{' '}
          <code
            style={{
              background: '#fff',
              padding: '0.2rem 0.4rem',
              borderRadius: '3px',
            }}
          >
            .mg-u-{'{property}'}--{'{modifier}'}
          </code>
        </InfoBox>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              padding: '0.5rem',
              background: '#f5f5f5',
              borderRadius: '4px',
            }}
          >
            <code>.mg-u-display--flex</code>
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              padding: '0.5rem',
              background: '#f5f5f5',
              borderRadius: '4px',
            }}
          >
            <code>.mg-u-margin-top-200</code>
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              padding: '0.5rem',
              background: '#f5f5f5',
              borderRadius: '4px',
            }}
          >
            <code>.mg-u-display--none--sm</code>{' '}
            <span style={{ color: '#666' }}>(responsive)</span>
          </div>
        </div>
      </Section>

      <Section title="Breakpoints">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              padding: '0.75rem',
              background: '#f5f5f5',
              borderRadius: '4px',
              borderLeft: '3px solid #60a5fa',
            }}
          >
            <code>--sm</code> <span style={{ color: '#666' }}>≤480px</span>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>
              Mobile only
            </div>
          </div>
          <div
            style={{
              padding: '0.75rem',
              background: '#f5f5f5',
              borderRadius: '4px',
              borderLeft: '3px solid #34d399',
            }}
          >
            <code>--md</code> <span style={{ color: '#666' }}>≥900px</span>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>
              Tablet and up
            </div>
          </div>
          <div
            style={{
              padding: '0.75rem',
              background: '#f5f5f5',
              borderRadius: '4px',
              borderLeft: '3px solid #a78bfa',
            }}
          >
            <code>--lg</code> <span style={{ color: '#666' }}>≥1164px</span>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>
              Desktop and up
            </div>
          </div>
          <div
            style={{
              padding: '0.75rem',
              background: '#f5f5f5',
              borderRadius: '4px',
              borderLeft: '3px solid #f472b6',
            }}
          >
            <code>--xl</code> <span style={{ color: '#666' }}>≥1440px</span>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>
              Wide desktop
            </div>
          </div>
        </div>
      </Section>

      <Section title="Spacing">
        <DemoBox title="Padding sizes">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem',
            }}
          >
            <div className="mg-u-padding-0" style={{ background: '#bfdbfe' }}>
              <div style={{ background: '#fff', padding: '0.5rem' }}>
                .mg-u-padding-0
              </div>
            </div>
            <div className="mg-u-padding-50" style={{ background: '#bfdbfe' }}>
              <div style={{ background: '#fff', padding: '0.5rem' }}>
                .mg-u-padding-50
              </div>
            </div>
            <div className="mg-u-padding-100" style={{ background: '#bfdbfe' }}>
              <div style={{ background: '#fff', padding: '0.5rem' }}>
                .mg-u-padding-100
              </div>
            </div>
            <div className="mg-u-padding-200" style={{ background: '#bfdbfe' }}>
              <div style={{ background: '#fff', padding: '0.5rem' }}>
                .mg-u-padding-200
              </div>
            </div>
            <div className="mg-u-padding-300" style={{ background: '#bfdbfe' }}>
              <div style={{ background: '#fff', padding: '0.5rem' }}>
                .mg-u-padding-300
              </div>
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Gap utilities">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {['0', '50', '100', '200'].map(size => (
              <div key={size}>
                <div className={`mg-u-display--flex mg-u-gap-${size}`}>
                  <div style={{ background: '#93c5fd', padding: '0.5rem' }}>
                    A
                  </div>
                  <div style={{ background: '#93c5fd', padding: '0.5rem' }}>
                    B
                  </div>
                  <div style={{ background: '#93c5fd', padding: '0.5rem' }}>
                    C
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginTop: '0.5rem',
                  }}
                >
                  .mg-u-gap-{size}
                </div>
              </div>
            ))}
          </div>
        </DemoBox>
      </Section>

      <Section title="Display">
        <DemoBox title="Display types">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <span className="mg-u-display--block mg-u-background-color--blue-100 mg-u-padding-100">
                Block (full width)
              </span>
            </div>
            <div>
              <span className="mg-u-display--inline mg-u-background-color--blue-200 mg-u-padding-100">
                Inline A
              </span>
              <span className="mg-u-display--inline mg-u-background-color--blue-300 mg-u-padding-100">
                Inline B
              </span>
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Flex container">
          <div className="mg-u-display--flex mg-u-gap-100">
            <div className="mg-u-background-color--sendai-turquoise mg-u-color--white mg-u-padding-100">
              Flex 1
            </div>
            <div className="mg-u-background-color--sendai-turquoise mg-u-color--white mg-u-padding-100">
              Flex 2
            </div>
            <div className="mg-u-background-color--sendai-turquoise mg-u-color--white mg-u-padding-100">
              Flex 3
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Grid container">
          <div
            className="mg-u-display--grid mg-u-gap-100"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div
                key={n}
                className="mg-u-background-color--sendai-orange mg-u-color--white mg-u-padding-100 mg-u-text-align--center"
              >
                {n}
              </div>
            ))}
          </div>
        </DemoBox>
      </Section>

      <Section title="Flexbox">
        <DemoBox title="Justify content">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {['start', 'center', 'end', 'between'].map(align => (
              <div key={align}>
                <div
                  className={`mg-u-display--flex mg-u-justify-content--${align} mg-u-gap-50`}
                  style={{ background: '#f5f5f5', padding: '0.5rem' }}
                >
                  <div style={{ background: '#bfdbfe', padding: '0.5rem' }}>
                    A
                  </div>
                  <div style={{ background: '#93c5fd', padding: '0.5rem' }}>
                    B
                  </div>
                  <div style={{ background: '#60a5fa', padding: '0.5rem' }}>
                    C
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginTop: '0.25rem',
                  }}
                >
                  .mg-u-justify-content--{align}
                </div>
              </div>
            ))}
          </div>
        </DemoBox>

        <DemoBox title="Align items">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem',
            }}
          >
            {['start', 'center', 'end', 'stretch'].map(align => (
              <div key={align}>
                <div
                  className={`mg-u-display--flex mg-u-align-items--${align} mg-u-gap-50`}
                  style={{
                    background: '#f5f5f5',
                    padding: '0.5rem',
                    height: '80px',
                  }}
                >
                  <div style={{ background: '#bfdbfe', padding: '0.5rem' }}>
                    A
                  </div>
                  <div style={{ background: '#93c5fd', padding: '1rem' }}>
                    B
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginTop: '0.25rem',
                  }}
                >
                  .mg-u-align-items--{align}
                </div>
              </div>
            ))}
          </div>
        </DemoBox>
      </Section>

      <Section title="Typography">
        <DemoBox title="Font size">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <span className="mg-u-font-size-200">
              .mg-u-font-size-200 (12.5px)
            </span>
            <span className="mg-u-font-size-300">
              .mg-u-font-size-300 (16px)
            </span>
            <span className="mg-u-font-size-400">
              .mg-u-font-size-400 (18px)
            </span>
            <span className="mg-u-font-size-500">
              .mg-u-font-size-500 (23px)
            </span>
            <span className="mg-u-font-size-600">
              .mg-u-font-size-600 (32px)
            </span>
          </div>
        </DemoBox>

        <DemoBox title="Font weight">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <span className="mg-u-font-weight--light mg-u-font-size-400">
              .mg-u-font-weight--light
            </span>
            <span className="mg-u-font-weight--normal mg-u-font-size-400">
              .mg-u-font-weight--normal
            </span>
            <span className="mg-u-font-weight--medium mg-u-font-size-400">
              .mg-u-font-weight--medium
            </span>
            <span className="mg-u-font-weight--semibold mg-u-font-size-400">
              .mg-u-font-weight--semibold
            </span>
            <span className="mg-u-font-weight--bold mg-u-font-size-400">
              .mg-u-font-weight--bold
            </span>
          </div>
        </DemoBox>

        <DemoBox title="Text alignment">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <div className="mg-u-text-align--left mg-u-background-color--neutral-100 mg-u-padding-100">
              .mg-u-text-align--left
            </div>
            <div className="mg-u-text-align--center mg-u-background-color--neutral-100 mg-u-padding-100">
              .mg-u-text-align--center
            </div>
            <div className="mg-u-text-align--right mg-u-background-color--neutral-100 mg-u-padding-100">
              .mg-u-text-align--right
            </div>
          </div>
        </DemoBox>
      </Section>

      <Section title="Colors">
        <DemoBox title="Interactive colors (theme-aware)">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div className="mg-u-padding-100">
              <span className="mg-u-color--interactive mg-u-font-size-400">
                .mg-u-color--interactive
              </span>
            </div>
            <div className="mg-u-padding-100">
              <span className="mg-u-color--interactive-active mg-u-font-size-400">
                .mg-u-color--interactive-active
              </span>
            </div>
            <div
              className="mg-u-background-color--interactive mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              .mg-u-background-color--interactive
            </div>
            <div
              className="mg-u-background-color--interactive-active mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              .mg-u-background-color--interactive-active
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Neutral colors">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '0.5rem',
            }}
          >
            <div
              className="mg-u-background-color--neutral-0 mg-u-padding-100 mg-u-border"
              style={{ textAlign: 'center' }}
            >
              0
            </div>
            <div
              className="mg-u-background-color--neutral-100 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              100
            </div>
            <div
              className="mg-u-background-color--neutral-200 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              200
            </div>
            <div
              className="mg-u-background-color--neutral-300 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              300
            </div>
            <div
              className="mg-u-background-color--neutral-500 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              500
            </div>
            <div
              className="mg-u-background-color--neutral-700 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              700
            </div>
            <div
              className="mg-u-background-color--neutral-900 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              900
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Blue colors">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '0.5rem',
            }}
          >
            <div
              className="mg-u-background-color--blue-50 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              50
            </div>
            <div
              className="mg-u-background-color--blue-100 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              100
            </div>
            <div
              className="mg-u-background-color--blue-200 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              200
            </div>
            <div
              className="mg-u-background-color--blue-300 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              300
            </div>
            <div
              className="mg-u-background-color--blue-500 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              500
            </div>
            <div
              className="mg-u-background-color--blue-700 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              700
            </div>
            <div
              className="mg-u-background-color--blue-900 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              900
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Sendai colors">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '0.5rem',
            }}
          >
            <div
              className="mg-u-background-color--sendai-red mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              sendai-red
            </div>
            <div
              className="mg-u-background-color--sendai-orange mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              sendai-orange
            </div>
            <div
              className="mg-u-background-color--sendai-purple mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              sendai-purple
            </div>
            <div
              className="mg-u-background-color--sendai-turquoise mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              sendai-turquoise
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Orange colors">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '0.5rem',
            }}
          >
            <div
              className="mg-u-background-color--orange-50 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              50
            </div>
            <div
              className="mg-u-background-color--orange-100 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              100
            </div>
            <div
              className="mg-u-background-color--orange-200 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              200
            </div>
            <div
              className="mg-u-background-color--orange-300 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              300
            </div>
            <div
              className="mg-u-background-color--orange-500 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              500
            </div>
            <div
              className="mg-u-background-color--orange-700 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              700
            </div>
            <div
              className="mg-u-background-color--orange-900 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              900
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Red colors">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '0.5rem',
            }}
          >
            <div
              className="mg-u-background-color--red-50 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              50
            </div>
            <div
              className="mg-u-background-color--red-100 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              100
            </div>
            <div
              className="mg-u-background-color--red-200 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              200
            </div>
            <div
              className="mg-u-background-color--red-300 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              300
            </div>
            <div
              className="mg-u-background-color--red-500 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              500
            </div>
            <div
              className="mg-u-background-color--red-700 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              700
            </div>
            <div
              className="mg-u-background-color--red-900 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              900
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Accent colors">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '0.5rem',
            }}
          >
            <div
              className="mg-u-background-color--accent-100 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              accent-100
            </div>
            <div
              className="mg-u-background-color--accent-200 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              accent-200
            </div>
            <div
              className="mg-u-background-color--accent-300 mg-u-padding-100"
              style={{ textAlign: 'center' }}
            >
              accent-300
            </div>
            <div
              className="mg-u-background-color--accent-400 mg-u-padding-100 mg-u-color--white"
              style={{ textAlign: 'center' }}
            >
              accent-400
            </div>
          </div>
        </DemoBox>
      </Section>

      <Section title="Shadows">
        <DemoBox title="Box shadows">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '1.5rem',
              padding: '1rem',
            }}
          >
            <div
              className="mg-u-box-shadow--none mg-u-padding-100 mg-u-border-radius mg-u-border"
              style={{ background: '#fff' }}
            >
              none
            </div>
            <div
              className="mg-u-box-shadow--sm mg-u-padding-100 mg-u-border-radius"
              style={{ background: '#fff' }}
            >
              sm
            </div>
            <div
              className="mg-u-box-shadow mg-u-padding-100 mg-u-border-radius"
              style={{ background: '#fff' }}
            >
              default
            </div>
            <div
              className="mg-u-box-shadow--md mg-u-padding-100 mg-u-border-radius"
              style={{ background: '#fff' }}
            >
              md
            </div>
            <div
              className="mg-u-box-shadow--lg mg-u-padding-100 mg-u-border-radius"
              style={{ background: '#fff' }}
            >
              lg
            </div>
            <div
              className="mg-u-box-shadow--xl mg-u-padding-100 mg-u-border-radius"
              style={{ background: '#fff' }}
            >
              xl
            </div>
            <div
              className="mg-u-box-shadow--2xl mg-u-padding-100 mg-u-border-radius"
              style={{ background: '#fff' }}
            >
              2xl
            </div>
            <div
              className="mg-u-box-shadow--inner mg-u-padding-100 mg-u-border-radius"
              style={{ background: '#fff' }}
            >
              inner
            </div>
          </div>
        </DemoBox>
      </Section>

      <Section title="Position">
        <DemoBox title="Absolute positioning">
          <div
            className="mg-u-position--relative"
            style={{ background: '#e5e5e5', width: '100%', height: '120px' }}
          >
            <div className="mg-u-position--absolute mg-u-top-0 mg-u-left-0 mg-u-background-color--blue-200 mg-u-padding-50">
              top-left
            </div>
            <div className="mg-u-position--absolute mg-u-top-0 mg-u-right-0 mg-u-background-color--blue-300 mg-u-padding-50">
              top-right
            </div>
            <div className="mg-u-position--absolute mg-u-bottom-0 mg-u-left-0 mg-u-background-color--blue-400 mg-u-padding-50 mg-u-color--white">
              bottom-left
            </div>
            <div className="mg-u-position--absolute mg-u-bottom-0 mg-u-right-0 mg-u-background-color--blue-500 mg-u-padding-50 mg-u-color--white">
              bottom-right
            </div>
          </div>
        </DemoBox>
      </Section>

      <Section title="Miscellaneous">
        <DemoBox title="Line clamp">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <div className="mg-u-line-clamp--1">
                This is a long paragraph that will be truncated to one line with
                an ellipsis.
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  marginTop: '0.5rem',
                }}
              >
                .mg-u-line-clamp--1
              </div>
            </div>
            <div>
              <div className="mg-u-line-clamp--2">
                This is a long paragraph that will be truncated to two lines
                with an ellipsis at the end.
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  marginTop: '0.5rem',
                }}
              >
                .mg-u-line-clamp--2
              </div>
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Comma separator">
          <div className="mg-u-comma-between">
            <span>Apple</span>
            <span>Banana</span>
            <span>Cherry</span>
            <span>Date</span>
          </div>
        </DemoBox>

        <DemoBox title="Text wrapping">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <div className="mg-u-text-wrap-balanced mg-u-background-color--neutral-100 mg-u-padding-100">
                This text uses balanced wrapping for better typography.
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  marginTop: '0.5rem',
                }}
              >
                .mg-u-text-wrap-balanced
              </div>
            </div>
            <div>
              <div className="mg-u-text-wrap-pretty mg-u-background-color--neutral-100 mg-u-padding-100">
                This text uses pretty wrapping for improved readability.
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  marginTop: '0.5rem',
                }}
              >
                .mg-u-text-wrap-pretty
              </div>
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Screen reader only">
          <div className="mg-u-padding-100 mg-u-background-color--neutral-100">
            Visible text
            <span className="mg-u-sr-only">
              {' '}
              (this text is hidden visually but read by screen readers)
            </span>{' '}
            followed by more visible text.
          </div>
          <div
            style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}
          >
            .mg-u-sr-only - hides content visually while keeping it accessible
          </div>
        </DemoBox>

        <DemoBox title="Responsive visibility">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.5rem',
            }}
          >
            <div className="mg-u-responsive--show-large mg-u-background-color--blue-100 mg-u-padding-100">
              .mg-u-responsive--show-large
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                Hidden on mobile
              </div>
            </div>
            <div className="mg-u-responsive--show-small mg-u-background-color--sendai-orange mg-u-color--white mg-u-padding-100">
              .mg-u-responsive--show-small
              <div style={{ fontSize: '0.8rem' }}>Hidden on tablet+</div>
            </div>
          </div>
        </DemoBox>

        <DemoBox title="Overflow">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <div
                className="mg-u-overflow--hidden"
                style={{
                  width: '150px',
                  height: '60px',
                  background: '#e5e5e5',
                  border: '1px solid #ccc',
                }}
              >
                <div
                  style={{
                    background: '#bfdbfe',
                    padding: '0.5rem',
                    width: '200px',
                  }}
                >
                  Content that overflows
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  marginTop: '0.5rem',
                }}
              >
                .mg-u-overflow--hidden
              </div>
            </div>
            <div>
              <div
                className="mg-u-overflow--auto"
                style={{
                  width: '150px',
                  height: '60px',
                  background: '#e5e5e5',
                  border: '1px solid #ccc',
                }}
              >
                <div
                  style={{
                    background: '#bfdbfe',
                    padding: '0.5rem',
                    width: '200px',
                  }}
                >
                  Content with scrollbar
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  marginTop: '0.5rem',
                }}
              >
                .mg-u-overflow--auto
              </div>
            </div>
          </div>
        </DemoBox>
      </Section>
    </div>
  ),
};
