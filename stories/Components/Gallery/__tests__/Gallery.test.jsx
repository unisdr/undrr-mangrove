import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import createHydrator from '../../../../src/hydrate';
import { Gallery } from '../Gallery';
import fromElement from '../Gallery.fromElement';

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

describe('Gallery analytics attributes', () => {
  const IMAGES = HTML_MEDIA.slice(1).concat({
    id: 'photo-2',
    type: 'image',
    src: 'https://picsum.photos/id/1016/800/600',
    alt: 'Second photo',
  });

  it.each(['overlay', 'corner'])(
    'labels %s arrows and thumbnails with fixed names',
    arrowStyle => {
      render(<Gallery media={IMAGES} arrowStyle={arrowStyle} loop />);
      const [prev, next] = [
        screen.getByRole('button', { name: /previous/i }),
        screen.getByRole('button', { name: /next/i }),
      ];
      expect(prev).toHaveAttribute(
        'data-vf-analytics-label',
        'Gallery: Previous'
      );
      expect(next).toHaveAttribute('data-vf-analytics-label', 'Gallery: Next');
      screen.getAllByRole('tab').forEach(tab => {
        expect(tab).toHaveAttribute(
          'data-vf-analytics-label',
          'Gallery: Thumbnail'
        );
      });
    }
  );

  it('sets a default region that the host can override or omit', () => {
    const { container, rerender } = render(<Gallery media={IMAGES} />);
    const root = () => container.querySelector('.mg-gallery');
    expect(root()).toHaveAttribute(
      'data-vf-google-analytics-region',
      'gallery'
    );
    rerender(<Gallery media={IMAGES} analyticsRegion="photo-essay" />);
    expect(root()).toHaveAttribute(
      'data-vf-google-analytics-region',
      'photo-essay'
    );
    rerender(<Gallery media={IMAGES} analyticsRegion="" />);
    expect(root()).not.toHaveAttribute('data-vf-google-analytics-region');
  });
});

describe('Gallery change event', () => {
  const MEDIA = ['First', 'Second', 'Third', 'Fourth'].map((title, index) => ({
    id: `item-${index}`,
    src: `/photo-${index}.jpg`,
    alt: `${title} photo`,
    title: `${title} title`,
    description: `${title} caption`,
  }));

  let events;
  const record = event => events.push(event);
  const details = () => events.map(event => event.detail);
  const root = () => document.querySelector('.mg-gallery');
  const swipe = (from, to) => {
    const stage = document.querySelector('.mg-gallery__image-wrapper');
    fireEvent.touchStart(stage, { touches: [{ clientX: from }] });
    fireEvent.touchMove(stage, { touches: [{ clientX: to }] });
    fireEvent.touchEnd(stage);
  };

  // jsdom has neither; navigation scrolls the thumbnail into view.
  const { matchMedia } = window;
  const { scrollIntoView } = Element.prototype;

  beforeEach(() => {
    events = [];
    window.matchMedia = jest.fn(() => ({ matches: false }));
    Element.prototype.scrollIntoView = jest.fn();
    document.addEventListener('mg-gallery:change', record);
  });

  afterEach(() => {
    document.removeEventListener('mg-gallery:change', record);
    window.matchMedia = matchMedia;
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  it('does not fire on mount, with or without an initial index', () => {
    render(
      <StrictMode>
        <Gallery media={MEDIA} />
        <Gallery media={MEDIA} initialIndex={2} />
      </StrictMode>
    );
    expect(events).toHaveLength(0);
  });

  it.each(['overlay', 'corner'])(
    'fires once for each %s arrow press, with method click',
    arrowStyle => {
      render(<Gallery media={MEDIA} arrowStyle={arrowStyle} />);
      fireEvent.click(screen.getByRole('button', { name: 'Next item' }));
      fireEvent.click(screen.getByRole('button', { name: 'Next item' }));
      fireEvent.click(screen.getByRole('button', { name: 'Previous item' }));
      expect(details()).toEqual([
        { region: 'gallery', index: 1, count: 4, method: 'click' },
        { region: 'gallery', index: 2, count: 4, method: 'click' },
        { region: 'gallery', index: 1, count: 4, method: 'click' },
      ]);
    }
  );

  it('fires once for a thumbnail, and not for the one already shown', () => {
    render(<Gallery media={MEDIA} />);
    fireEvent.click(screen.getByRole('tab', { name: 'View Third title' }));
    fireEvent.click(screen.getByRole('tab', { name: 'View Third title' }));
    expect(details()).toEqual([
      { region: 'gallery', index: 2, count: 4, method: 'thumbnail' },
    ]);
  });

  it('fires once for each arrow, Home and End key that changes the item', () => {
    render(<Gallery media={MEDIA} />);
    ['ArrowLeft', 'Home', 'ArrowRight', 'End', 'End', 'ArrowRight'].forEach(
      key => fireEvent.keyDown(root(), { key })
    );
    fireEvent.keyDown(root(), { key: 'ArrowLeft' });
    fireEvent.keyDown(root(), { key: 'Home' });
    expect(details()).toEqual([
      { region: 'gallery', index: 1, count: 4, method: 'key' },
      { region: 'gallery', index: 3, count: 4, method: 'key' },
      { region: 'gallery', index: 2, count: 4, method: 'key' },
      { region: 'gallery', index: 0, count: 4, method: 'key' },
    ]);
  });

  it('fires once for a swipe, and not for a short drag or a tap', () => {
    render(<Gallery media={MEDIA} />);
    swipe(200, 180);
    fireEvent.touchStart(root().querySelector('.mg-gallery__image-wrapper'), {
      touches: [{ clientX: 200 }],
    });
    fireEvent.touchEnd(root().querySelector('.mg-gallery__image-wrapper'));
    expect(events).toHaveLength(0);
    swipe(200, 100);
    swipe(100, 200);
    swipe(100, 200);
    expect(details()).toEqual([
      { region: 'gallery', index: 1, count: 4, method: 'swipe' },
      { region: 'gallery', index: 0, count: 4, method: 'swipe' },
    ]);
  });

  it('fires for a loop wrap, and not for a gallery with one item', () => {
    const { unmount } = render(<Gallery media={MEDIA} loop />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous item' }));
    expect(details()).toEqual([
      { region: 'gallery', index: 3, count: 4, method: 'click' },
    ]);
    unmount();
    events = [];
    render(<Gallery media={MEDIA.slice(0, 1)} loop />);
    fireEvent.click(screen.getByRole('button', { name: 'Next item' }));
    fireEvent.keyDown(root(), { key: 'ArrowRight' });
    expect(events).toHaveLength(0);
  });

  it('fires once in strict mode, after the new item is on screen', () => {
    let shown;
    const read = event => {
      shown = event.target.querySelector('.mg-gallery__image').alt;
    };
    document.addEventListener('mg-gallery:change', read);
    render(
      <StrictMode>
        <Gallery media={MEDIA} />
      </StrictMode>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next item' }));
    document.removeEventListener('mg-gallery:change', read);
    expect(events).toHaveLength(1);
    expect(shown).toBe('Second photo');
  });

  it('bubbles from the gallery root and carries no content', () => {
    render(<Gallery media={MEDIA} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next item' }));
    const [event] = events;
    expect(event.bubbles).toBe(true);
    expect(event.target).toBe(root());
    expect(Object.keys(event.detail).sort()).toEqual([
      'count',
      'index',
      'method',
      'region',
    ]);
    expect(JSON.stringify(event.detail)).not.toMatch(/title|caption|photo/i);
  });

  it('reports the region the click tracker would report', () => {
    const { rerender } = render(
      <section data-vf-google-analytics-region="photo-essay">
        <Gallery media={MEDIA} analyticsRegion="field-visit" />
      </section>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next item' }));
    rerender(
      <section data-vf-google-analytics-region="photo-essay">
        <Gallery media={MEDIA} analyticsRegion="" />
      </section>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next item' }));
    rerender(<Gallery media={MEDIA} analyticsRegion="" />);
    fireEvent.click(screen.getByRole('button', { name: 'Next item' }));
    expect(details().map(detail => detail.region)).toEqual([
      'field-visit',
      'photo-essay',
      '',
    ]);
  });

  it('still calls onMediaChange as before, including for the item already shown', () => {
    const onMediaChange = jest.fn();
    render(<Gallery media={MEDIA} onMediaChange={onMediaChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'View First title' }));
    fireEvent.click(screen.getByRole('tab', { name: 'View Second title' }));
    expect(onMediaChange.mock.calls).toEqual([
      [0, MEDIA[0]],
      [1, MEDIA[1]],
    ]);
    expect(events).toHaveLength(1);
  });

  describe('hydrated', () => {
    let hydrator;

    afterEach(() => {
      act(() => hydrator?.unmountAll());
      hydrator = undefined;
      document.body.innerHTML = '';
    });

    it('fires from a hydrated gallery, once for each change and not on mount', () => {
      const host = document.createElement('div');
      host.setAttribute('data-mg-gallery', '');
      host.setAttribute('data-media', JSON.stringify(MEDIA));
      host.setAttribute('data-initial-index', '1');
      host.setAttribute('data-vf-google-analytics-region', 'photo-essay');
      document.body.append(host);

      act(() => {
        hydrator = createHydrator({
          selector: '[data-mg-gallery]',
          component: Gallery,
          fromElement,
        });
      });
      expect(hydrator.roots).toHaveLength(1);
      expect(events).toHaveLength(0);

      fireEvent.click(screen.getByRole('button', { name: 'Next item' }));
      fireEvent.keyDown(root(), { key: 'ArrowLeft' });
      fireEvent.click(screen.getByRole('tab', { name: 'View Fourth title' }));
      swipe(100, 200);

      expect(details()).toEqual([
        { region: 'photo-essay', index: 2, count: 4, method: 'click' },
        { region: 'photo-essay', index: 1, count: 4, method: 'key' },
        { region: 'photo-essay', index: 3, count: 4, method: 'thumbnail' },
        { region: 'photo-essay', index: 2, count: 4, method: 'swipe' },
      ]);
      expect(events.every(event => host.contains(event.target))).toBe(true);
    });
  });
});
