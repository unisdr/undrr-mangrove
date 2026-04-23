/**
 * @file BrandIdentity.stories.jsx
 * @description Dynamic brand identity page that responds to the Storybook theme picker.
 * Uses a decorator to pass the active theme name as a prop, avoiding useGlobals
 * hook issues in docs mode.
 */

import React, { useState, useEffect } from 'react';
import LinkTo from '@storybook/addon-links/react';
import { ColorSwatch } from './components/ColorSwatch';
import { TypographySample } from './components/TypographySample';
import { HighlightBox } from '../../Components/HighlightBox/HighlightBox';
import { Heading } from '../../Atom/Typography/Heading/Heading';
import { CtaButton } from '../../Components/Buttons/CtaButton/CtaButton';
import { Icon } from '../../Atom/Icons/Icon';
import { P } from '../../Atom/BaseTypography/Paragraph/Paragraph';
import { Small } from '../../Atom/BaseTypography/Small/Small';
import { getTheme, colorProbes } from './data/themes';

const grid4 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '1rem',
};
const grid2 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '1rem',
};

/**
 * Reads a CSS color value from the DOM by creating a temporary probe element.
 */
function probeColor(className, property = 'background-color') {
  const el = document.createElement('div');
  el.className = className;
  el.style.position = 'absolute';
  el.style.visibility = 'hidden';
  document.body.appendChild(el);
  const val = window.getComputedStyle(el).getPropertyValue(property);
  document.body.removeChild(el);
  return val;
}

function rgbToHex(rgb) {
  if (!rgb) return null;
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return (
    '#' +
    [1, 2, 3]
      .map(i => parseInt(match[i], 10).toString(16).padStart(2, '0'))
      .join('')
  );
}

function BrandIdentityPage({ themeName }) {
  // Re-render after CSS is loaded by the theme decorator.
  // The decorator's useEffect injects CSS after the first render,
  // so we need a second pass to probe the correct values.
  const [, rerender] = useState(0);
  useEffect(() => {
    requestAnimationFrame(() => rerender(n => n + 1));
  }, [themeName]);

  const theme = getTheme(themeName);
  const primaryColor = rgbToHex(probeColor('mg-button-primary')) || '#004f91';

  return (
    <div style={{ fontFamily: "'Roboto', sans-serif", maxWidth: 900 }}>
      {/* Hero */}
      <div
        style={{
          background: primaryColor,
          color: 'white',
          padding: '3rem 2.5rem',
          borderRadius: '4px',
          marginBottom: '2rem',
        }}
      >
        <h1
          style={{
            fontFamily: "'Roboto Condensed', sans-serif",
            fontSize: '2.625rem',
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.5px',
          }}
        >
          {theme.name}
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            opacity: 0.9,
            margin: '0.5rem 0 0.25rem',
          }}
        >
          {theme.tagline}
        </p>
        <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>{theme.url}</span>
      </div>

      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Use the <strong>theme selector</strong> in the toolbar above to switch
        between UNDRR properties. The entire page updates to show that
        property's colors, typography, and guidelines.
      </p>

      {/* Logo */}
      {theme.logo && (
        <>
          <h2>Logo</h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              marginBottom: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                background: '#f5f5f5',
                padding: '2rem 3rem',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
              }}
            >
              <img
                src={theme.logo.src}
                alt={theme.logo.alt}
                style={{ height: '45px', width: 'auto' }}
              />
            </div>
            {theme.logo.srcWhite && (
              <div
                style={{
                  background: primaryColor,
                  padding: '2rem 3rem',
                  borderRadius: '4px',
                }}
              >
                <img
                  src={theme.logo.srcWhite}
                  alt={`${theme.logo.alt} (white variant)`}
                  style={{ height: '45px', width: 'auto' }}
                />
              </div>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Download a copy or hotlink directly to the CDN:
          </p>
          <table
            style={{
              width: '100%',
              fontSize: '0.8125rem',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem 0.5rem 0',
                    fontWeight: 600,
                  }}
                >
                  Variant
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    fontWeight: 600,
                  }}
                >
                  CDN URL (copy to hotlink)
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0',
                    fontWeight: 600,
                  }}
                >
                  Download
                </th>
              </tr>
            </thead>
            <tbody>
              {theme.logo.variants.map(v => (
                <tr key={v.url} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.5rem 0.75rem 0.5rem 0' }}>
                    {v.label}
                  </td>
                  <td
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      wordBreak: 'break-all',
                    }}
                  >
                    <code>{v.url}</code>
                  </td>
                  <td style={{ padding: '0.5rem 0' }}>
                    <a
                      href={v.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: primaryColor,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Download ↓
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr style={{ margin: '2rem 0' }} />
        </>
      )}

      {/* Color palette — probed live from compiled theme CSS */}
      <h2>Color palette</h2>
      <p>
        Colors used across {theme.url}. Click any swatch to copy its hex value.
        These values are read directly from the active theme's compiled CSS.
      </p>

      <h3>Brand and interactive colors</h3>
      <div style={grid4}>
        {colorProbes.brand.map((c, i) => (
          <ColorSwatch
            key={`brand-${i}`}
            color={rgbToHex(probeColor(c.probe, c.property))}
            name={c.name}
            usage={c.usage}
          />
        ))}
      </div>

      <h3>Accent colors</h3>
      <div style={grid4}>
        {colorProbes.accent.map((c, i) => (
          <ColorSwatch
            key={`accent-${i}`}
            color={rgbToHex(probeColor(c.probe, c.property))}
            name={c.name}
            usage={c.usage}
          />
        ))}
      </div>

      <h3>Neutral colors</h3>
      <div style={grid4}>
        {colorProbes.neutral.map((c, i) => (
          <ColorSwatch
            key={`neutral-${i}`}
            color={c.color}
            name={c.name}
            usage={c.usage}
          />
        ))}
      </div>

      <hr style={{ margin: '2rem 0' }} />

      {/* Typography */}
      <h2>Typography</h2>
      <p>
        {theme.name} uses Roboto for body text and Roboto Condensed for
        headings.
      </p>

      <TypographySample
        fontFamily="Roboto Condensed"
        fontSize="2.625rem"
        fontWeight={700}
        label="Page title"
        lineHeight="1.1"
      >
        <Heading type="1">Page title</Heading>
      </TypographySample>
      <TypographySample
        fontFamily="Roboto Condensed"
        fontSize="1.75rem"
        fontWeight={700}
        label="Section heading"
        lineHeight="1.2"
      >
        <Heading type="2">Section heading</Heading>
      </TypographySample>
      <TypographySample
        fontFamily="Roboto Condensed"
        fontSize="1.375rem"
        fontWeight={600}
        label="Subsection heading"
        lineHeight="1.3"
      >
        <Heading type="3">Subsection heading</Heading>
      </TypographySample>
      <TypographySample
        fontFamily="Roboto"
        fontSize="1rem"
        fontWeight={400}
        label="Body text"
        lineHeight="1.5"
      >
        <P
          detail={`Body text looks like this. It's used for descriptions, paragraphs, and general content across ${theme.url}.`}
        />
      </TypographySample>
      <TypographySample
        fontFamily="Roboto"
        fontSize="0.8125rem"
        fontWeight={400}
        label="Small text"
        lineHeight="1.4"
      >
        <Small detail="Small text for metadata, dates, and captions" />
      </TypographySample>

      <hr style={{ margin: '2rem 0' }} />

      {/* Buttons */}
      <h2>Buttons</h2>
      <p>
        Primary buttons use the brand color. Secondary buttons use an outline
        style.
      </p>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1rem',
        }}
      >
        <CtaButton label="Primary action" Type="Primary" />
        <CtaButton label="Secondary action" Type="Secondary" />
        <CtaButton label="Disabled" Type="Primary" State="Disabled" />
      </div>

      <hr style={{ margin: '2rem 0' }} />

      {/* Icons */}
      <h2>Icons</h2>
      <p>
        Mangrove includes a custom icon set. Use{' '}
        <code>mg-icon mg-icon-name</code> classes in HTML, or the{' '}
        <code>{'<Icon name="..." />'}</code> React component.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {[
          { name: 'globe', label: 'Globe' },
          { name: 'search', label: 'Search' },
          { name: 'envelope', label: 'Email' },
          { name: 'calendar-alt', label: 'Calendar' },
          { name: 'chart-bar', label: 'Chart' },
          { name: 'user', label: 'User' },
          { name: 'file-alt', label: 'Document' },
          { name: 'share', label: 'Share' },
          { name: 'link', label: 'Link' },
          { name: 'lightbulb', label: 'Idea' },
          { name: 'newspaper', label: 'News' },
          { name: 'building', label: 'Building' },
          { name: 'graduation-cap', label: 'Education' },
          { name: 'life-ring', label: 'Support' },
          { name: 'tags', label: 'Tags' },
          { name: 'earthquake', label: 'Earthquake' },
          { name: 'tsunami', label: 'Tsunami' },
          { name: 'flood', label: 'Flood' },
          { name: 'cyclone', label: 'Cyclone' },
          { name: 'drought', label: 'Drought' },
          { name: 'resilience', label: 'Resilience' },
        ].map(icon => (
          <div
            key={icon.name}
            style={{ textAlign: 'center', padding: '0.75rem 0' }}
          >
            <Icon name={icon.name} size="lg" />
            <div
              style={{
                fontSize: '0.6875rem',
                color: '#666',
                marginTop: '0.25rem',
              }}
            >
              {icon.label}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.875rem', color: '#666' }}>
        Showing 21 of 80+ icons, including OCHA humanitarian icons. See the full
        set in the{' '}
        <LinkTo kind="components-icons" story="docs">Icons documentation</LinkTo>.
      </p>

      <hr style={{ margin: '2rem 0' }} />

      {/* Usage guidelines */}
      <h2>Usage guidelines</h2>
      <div style={grid2}>
        <HighlightBox>
          <strong>Do:</strong> Use the primary brand color ({primaryColor}) for
          navigation headers and brand elements on {theme.url}.
        </HighlightBox>
        <HighlightBox variant="secondary">
          <span style={{ color: 'white' }}>
            <strong>Don't:</strong> Mix brand colors from other UNDRR
            properties. Each property has its own identity.
          </span>
        </HighlightBox>
      </div>
      <div style={{ ...grid2, marginTop: '1rem' }}>
        <HighlightBox>
          <strong>Do:</strong> Use Roboto Condensed for headings and Roboto
          Regular for body text.
        </HighlightBox>
        <HighlightBox variant="secondary">
          <span style={{ color: 'white' }}>
            <strong>Don't:</strong> Use Arial, Helvetica, or other system fonts.
            Stick to the specified font families.
          </span>
        </HighlightBox>
      </div>
    </div>
  );
}

export default {
  title: 'Brand/Brand identity',
  parameters: {
    layout: 'padded',
    docs: {
      canvas: { hidden: true },
    },
  },
  decorators: [
    (Story, context) => {
      const themeName = context.globals.theme || 'Global UNDRR Theme';
      return <Story args={{ ...context.args, themeName }} />;
    },
  ],
};

export const Docs = {
  render: args => <BrandIdentityPage themeName={args.themeName} />,
};
