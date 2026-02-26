import React from 'react';

export default {
  title: 'Atom/Tag',
  parameters: {
    docs: {
      description: {
        component:
          'A compact tag used to categorise content (content type, country, theme, etc.). ' +
          'Replaces the legacy `.st-tag--spl` class with a Mangrove-native BEM pattern. ' +
          'Supports `--secondary`, `--outline`, and `--accent` color variants. ' +
          'Use `.mg-tag-container` to auto-style child elements without individual classes.',
      },
    },
  },
};

export const Default = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <span className="mg-tag">Organization</span>
      <span className="mg-tag">News</span>
      <span className="mg-tag">Publication</span>
      <span className="mg-tag">Event</span>
      <span className="mg-tag">Country</span>
    </div>
  ),
};

export const AsLink = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <a href="#" className="mg-tag">
        Nepal
      </a>
      <a href="#" className="mg-tag">
        Earthquake
      </a>
      <a href="#" className="mg-tag">
        Climate change
      </a>
    </div>
  ),
  name: 'As link',
};

export const Secondary = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <span className="mg-tag mg-tag--secondary">Metadata</span>
      <span className="mg-tag mg-tag--secondary">Archive</span>
      <a href="#" className="mg-tag mg-tag--secondary">
        Reference
      </a>
    </div>
  ),
};

export const Outline = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <span className="mg-tag mg-tag--outline">Subtle</span>
      <span className="mg-tag mg-tag--outline">Lightweight</span>
      <a href="#" className="mg-tag mg-tag--outline">
        Linked
      </a>
    </div>
  ),
};

export const Accent = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <span className="mg-tag mg-tag--accent">Featured</span>
      <span className="mg-tag mg-tag--accent">Urgent</span>
      <a href="#" className="mg-tag mg-tag--accent">
        Highlighted
      </a>
    </div>
  ),
};

export const AllVariants = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <strong style={{ minWidth: '80px' }}>Default</strong>
        <span className="mg-tag">Organization</span>
        <a href="#" className="mg-tag">
          Link
        </a>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <strong style={{ minWidth: '80px' }}>Secondary</strong>
        <span className="mg-tag mg-tag--secondary">Metadata</span>
        <a href="#" className="mg-tag mg-tag--secondary">
          Link
        </a>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <strong style={{ minWidth: '80px' }}>Outline</strong>
        <span className="mg-tag mg-tag--outline">Subtle</span>
        <a href="#" className="mg-tag mg-tag--outline">
          Link
        </a>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <strong style={{ minWidth: '80px' }}>Accent</strong>
        <span className="mg-tag mg-tag--accent">Featured</span>
        <a href="#" className="mg-tag mg-tag--accent">
          Link
        </a>
      </div>
    </div>
  ),
  name: 'All variants',
};

export const TagContainer = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <p style={{ margin: '0 0 8px', fontWeight: 'bold' }}>
          Auto-styled children (no .mg-tag class needed):
        </p>
        <div className="mg-tag-container">
          <span>Organization</span>
          <span>News</span>
          <a href="#">Nepal</a>
          <div>Event</div>
        </div>
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontWeight: 'bold' }}>
          Drupal migration — existing markup structure:
        </p>
        <div className="mg-tag-container">
          <a href="/taxonomy/term/123">Earthquake</a>
          <a href="/taxonomy/term/456">Climate change</a>
          <a href="/taxonomy/term/789">Early warning</a>
        </div>
      </div>
    </div>
  ),
  name: 'Tag container',
};

export const InContext = {
  render: () => (
    <div className="mg-card__content" style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '8px' }}>
        <span className="mg-tag">Organization</span>
      </div>
      <h3 className="mg-card__title" style={{ margin: '0 0 8px' }}>
        <a href="#">
          International Federation of Red Cross and Red Crescent Societies
        </a>
      </h3>
      <p style={{ margin: 0, color: '#666' }}>
        The IFRC is the world's largest humanitarian organization, providing
        assistance without discrimination as to nationality, race, religious
        beliefs, class or political opinions.
      </p>
    </div>
  ),
  name: 'In context',
};
