import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

export default {
  title: 'Components/Tag',
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
      <span className="mg-tag mg-tag--accent">Spotlight</span>
      <a href="#" className="mg-tag mg-tag--accent">
        Highlighted
      </a>
    </div>
  ),
};

export const AllVariants = {
  play: async ({ canvasElement }) => {
    const tags = [...canvasElement.querySelectorAll('.mg-tag')];
    for (let index = 0; index < tags.length; index += 2) {
      const label = tags[index];
      const link = tags[index + 1];
      expect(label.getBoundingClientRect().height).toBe(
        link.getBoundingClientRect().height
      );
      for (const property of [
        'display',
        'padding',
        'minWidth',
        'minHeight',
        'lineHeight',
        'borderWidth',
      ]) {
        expect(getComputedStyle(label)[property]).toBe(
          getComputedStyle(link)[property]
        );
      }
    }
  },
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
          Drupal migration (existing markup structure):
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

export const ReflowAndLanguages = {
  name: 'Reflow and languages',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', {
      name: 'Disaster risk reduction and climate adaptation',
    });
    const group = link.parentElement;
    // A real browser catches CSS cascade and sizing failures that jsdom cannot.
    expect(getComputedStyle(link).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
    for (const destination of canvas.getAllByRole('link')) {
      expect(destination.getBoundingClientRect().height).toBeGreaterThanOrEqual(
        24
      );
      expect(destination.getBoundingClientRect().width).toBeGreaterThanOrEqual(
        24
      );
    }
    const label = canvas.getByText('Research');
    const background = getComputedStyle(label).backgroundColor;
    await userEvent.hover(label);
    expect(getComputedStyle(label).backgroundColor).toBe(background);
    await userEvent.unhover(label);
    await userEvent.tab();
    await expect(link).toHaveFocus();
    expect(getComputedStyle(link).outlineStyle).not.toBe('none');
  },
  render: () => (
    <div style={{ maxWidth: '280px', display: 'grid', gap: '24px' }}>
      <div className="mg-tag-container">
        <span className="mg-tag mg-tag--secondary">Research</span>
        <a href="#topic" className="mg-tag mg-tag--outline">
          Disaster risk reduction and climate adaptation
        </a>
        <a href="#identifier">Averylongunbrokentaxonomyidentifierforreflow</a>
      </div>
      <div className="mg-tag-container" lang="ar" dir="rtl">
        <span>الحد من مخاطر الكوارث</span>
        <a href="#warning">الإنذار المبكر</a>
        <a href="#climate" className="mg-tag mg-tag--outline">
          التكيف مع تغير المناخ
        </a>
      </div>
    </div>
  ),
};
