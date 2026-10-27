import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

describe('Gallery motion and loading', () => {
  it.each([false, true])(
    'reads the current reduced-motion preference on navigation (%s)',
    reduced => {
      const scrollIntoView = jest.fn();
      const matchMedia = window.matchMedia;
      window.matchMedia = jest.fn(() => ({ matches: reduced }));
      render(<Gallery media={HTML_MEDIA} />);
      const tab = screen.getByRole('tab', { name: 'View Field visit' });
      tab.scrollIntoView = scrollIntoView;
      fireEvent.click(tab);
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: reduced ? 'instant' : 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      window.matchMedia = matchMedia;
    }
  );

  it('uses one shared status region with the translated loading label', async () => {
    const media = [
      { id: 'video', type: 'video', src: '/pending.mp4', alt: 'Film' },
    ];
    const { container } = render(
      <Gallery media={media} labels={{ loadingLabel: 'Chargement' }} />
    );
    const status = screen.getByRole('status');
    expect(status).toHaveClass('mg-loader--inline');
    expect(await screen.findByText('Chargement')).toBeInTheDocument();
    expect(
      container.querySelectorAll('[aria-live], [role="status"]')
    ).toHaveLength(1);
    fireEvent.loadedData(container.querySelector('video'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
