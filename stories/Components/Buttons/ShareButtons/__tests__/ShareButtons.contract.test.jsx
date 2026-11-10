import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createAjv } from '../../../../../schemas/ajv-setup.js';
import shareActionSchema from '../../../../../schemas/dist/share-action.schema.json';
import ShareButtons from '../ShareButtons';

// ShareButtons reads window.location and uses navigator.clipboard at runtime.
// These contract tests only verify schema validity and that the component
// mounts without error — interactive behavior is out of scope here.

describe('ShareButtons contract', () => {
  const validate = createAjv().compile(shareActionSchema);

  it('minimal fixture validates against share-action schema', () => {
    const fixture = { labels: { mainLabel: 'Share this' } };
    expect(validate(fixture)).toBe(true);
  });

  it('fixture with sharingSubject and sharingBody validates against share-action schema', () => {
    const fixture = {
      labels: { mainLabel: 'Share this', onCopy: 'Link copied' },
      sharingSubject: 'Check out this resource',
      sharingBody: 'I found this helpful: ',
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders a section element for schema-valid minimal fixture', () => {
    const { container } = render(
      <ShareButtons labels={{ mainLabel: 'Share this' }} />
    );
    expect(container.querySelector('section.mg-share')).toBeInTheDocument();
  });

  it('renders the mainLabel text and has no accessibility violations', async () => {
    const { container } = render(
      <ShareButtons labels={{ mainLabel: 'Share this page' }} />
    );
    const header = container.querySelector('.mg-share__header');
    expect(header).toHaveTextContent('Share this page');
    expect(await axe(container)).toHaveNoViolations();
  });
});
