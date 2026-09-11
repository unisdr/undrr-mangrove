import React from 'react';
import { FullWidth } from './FullWidth';

export default {
  title: 'Components/FullWidth',
  component: FullWidth,
};

export const DefaultFullWidth = {
  render: args => (
    <div style={{ maxWidth: '500px' }}>
      <FullWidth {...args} />
    </div>
  ),
  args: {
    children: "I'll be made full width",
  },
  name: 'FullWidth',
};

// Demo scaffolding. The band colour and the wrapper backgrounds are inline so
// the two cases can be read side by side without a stylesheet; nothing here is
// public API.
// Note: no text-align here. Centring text on the utility also moves the
// pseudo-element's static position, which pushes the bleed off to one side.
const band = {
  background: '#2e7d32',
  color: '#fff',
  padding: '0.75rem 1rem',
};

const label = {
  font: '0.75rem/1.4 system-ui, sans-serif',
  margin: '0 0 0.25rem',
  padding: '0 0.5rem',
};

/**
 * Side-by-side demonstration of the ancestor-background constraint.
 *
 * The two cases are identical apart from the wrapper's background. The first
 * wrapper is opaque, so it paints over the bleed and the band stops at the
 * container edge. The second wrapper is transparent, so the bleed shows.
 */
export const BlockedByAncestorBackground = {
  name: 'Blocked by an ancestor background',
  parameters: {
    // Without this, Storybook's body padding stops the opaque wrapper short of
    // the viewport edge and a sliver of the covered bleed shows past it.
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'The band on top is inside a wrapper with an opaque background, so its bleed is covered and it stays container-width. The band below has a transparent wrapper and spreads. Storybook clips both to the canvas, so compare the widths rather than looking for a true edge-to-edge result.',
      },
    },
  },
  render: () => (
    <div style={{ paddingBlock: '1rem' }}>
      <p style={label}>Opaque wrapper — bleed is covered, band stays narrow</p>
      <div style={{ background: '#fff' }}>
        <div className="mg-container" style={{ maxWidth: '360px' }}>
          <div className="mg-container-full-width" style={band}>
            No bleed
          </div>
        </div>
      </div>

      <p style={{ ...label, marginTop: '1.5rem' }}>
        Transparent wrapper — bleed shows
      </p>
      <div>
        <div className="mg-container" style={{ maxWidth: '360px' }}>
          <div className="mg-container-full-width" style={band}>
            Bleed
          </div>
        </div>
      </div>

      <p style={{ ...label, marginTop: '1.5rem' }}>
        Opaque wrapper plus <code>isolation: isolate</code> — bleed shows again
      </p>
      <div style={{ background: '#fff' }}>
        <div className="mg-container" style={{ maxWidth: '360px' }}>
          <div
            className="mg-container-full-width"
            style={{ ...band, isolation: 'isolate' }}
          >
            Bleed
          </div>
        </div>
      </div>
    </div>
  ),
};
