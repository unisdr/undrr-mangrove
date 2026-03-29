import React from 'react';
import { render } from '@testing-library/react';
import { createAjv } from '../../../../schemas/ajv-setup.js';
import navigationSchema from '../../../../schemas/dist/navigation.schema.json';
import MegaMenu from '../MegaMenu';

describe('MegaMenu contract', () => {
  const validate = createAjv().compile(navigationSchema);

  it('minimal fixture validates against navigation schema', () => {
    const fixture = { sections: [{ title: 'About' }] };
    expect(validate(fixture)).toBe(true);
  });

  it('renders a nav element for schema-valid minimal fixture', () => {
    const { container } = render(
      <MegaMenu sections={[{ title: 'About' }]} />
    );
    expect(container.querySelector('nav')).toBeInTheDocument();
  });

  it('fixture with nested items validates against navigation schema', () => {
    const fixture = {
      sections: [
        {
          title: 'Topics',
          items: [
            {
              title: 'Resilience',
              url: 'https://example.com/resilience',
              items: [
                { title: 'Risk assessment', url: 'https://example.com/risk' },
              ],
            },
          ],
        },
      ],
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders a nav with the default aria-label', () => {
    const { container } = render(
      <MegaMenu sections={[{ title: 'Home' }]} />
    );
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', 'Main Navigation');
  });

  it('renders a nav with a custom ariaLabel', () => {
    const { container } = render(
      <MegaMenu
        sections={[{ title: 'Home' }]}
        ariaLabel="Primary site navigation"
      />
    );
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', 'Primary site navigation');
  });
});
