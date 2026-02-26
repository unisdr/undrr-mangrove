import React from 'react';

export default {
  title: 'Atom/Tag',
  parameters: {
    docs: {
      description: {
        component:
          'A compact tag used to categorise content (content type, country, theme, etc.). ' +
          'Replaces the legacy `.st-tag--spl` class with a Mangrove-native BEM pattern. ' +
          'Uses the `$mg-color-tag` and `$mg-radius-tag` design tokens, with a ' +
          '`--tag-color-background` CSS custom property override for Drupal theme integration.',
      },
    },
  },
};

export const Default = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      <span className="mg-tag">Organization</span>
      <span className="mg-tag">News</span>
      <span className="mg-tag">Publication</span>
      <span className="mg-tag">Event</span>
      <span className="mg-tag">Country</span>
    </div>
  ),
  name: 'Default',
};

export const AsLink = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <a href="#" className="mg-tag">Nepal</a>
      <a href="#" className="mg-tag">Earthquake</a>
      <a href="#" className="mg-tag">Climate change</a>
    </div>
  ),
  name: 'As link',
};

export const InContext = {
  render: () => (
    <div className="mg-card__content" style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '8px' }}>
        <span className="mg-tag">Organization</span>
      </div>
      <h3 className="mg-card__title" style={{ margin: '0 0 8px' }}>
        <a href="#">International Federation of Red Cross and Red Crescent Societies</a>
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
