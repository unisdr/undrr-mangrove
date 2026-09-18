import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Gallery } from '../Gallery';

expect.extend(toHaveNoViolations);

const HTML_MEDIA = [
  {
    id: 'chart',
    type: 'html',
    title: 'Hazard chart',
    html: '<div><p>Hazard exposure</p><a href="/data">Download the data</a><button type="button">Toggle series</button></div>',
  },
  {
    id: 'photo',
    type: 'image',
    title: 'Field visit',
    src: 'https://picsum.photos/id/1015/800/600',
    alt: 'Field visit',
  },
];

describe('Gallery HTML thumbnails', () => {
  it('neutralises interactive content injected into the tab button', () => {
    const { container } = render(<Gallery media={HTML_MEDIA} />);

    const preview = container.querySelector(
      '.mg-gallery__thumbnail-html-preview'
    );
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute('inert');
    expect(preview).toHaveAttribute('aria-hidden', 'true');

    preview.querySelectorAll('a[href], button').forEach(node => {
      expect(node).toHaveAttribute('tabindex', '-1');
    });
  });

  it('keeps the thumbnail tab itself operable and named', () => {
    render(<Gallery media={HTML_MEDIA} />);

    const tab = screen.getByRole('tab', { name: 'View Hazard chart' });
    expect(tab).toBeEnabled();
    expect(tab).not.toHaveAttribute('inert');
    expect(tab).not.toHaveAttribute('tabindex', '-1');
  });

  it('has no axe violations with HTML thumbnails', async () => {
    const { container } = render(<Gallery media={HTML_MEDIA} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
