import React, { useId, useState } from 'react';
import { cacheKey, createSourceTransform } from '../docsSource';
import * as renderer from '../docsSourceRender';

const h = React.createElement;
const html = { docs: { source: { html: true } } };

let storyCount = 0;
const context = overrides => {
  storyCount += 1;
  return {
    id: `test--story-${storyCount}`,
    title: 'Components/Test story',
    args: {},
    globals: { locale: 'english' },
    parameters: html,
    ...overrides,
  };
};

describe('docs source transform', () => {
  let transform;
  let load;
  let warn;

  beforeEach(() => {
    load = jest.fn(() => Promise.resolve(renderer));
    transform = createSourceTransform({ load });
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => warn.mockRestore());

  it('renders opted-in stories to formatted HTML', async () => {
    const code = await transform(
      '{ render: () => <div className="mg-empty-state" /> }',
      context({
        originalStoryFn: () =>
          h(
            'div',
            { className: 'mg-empty-state' },
            h('h2', { className: 'mg-empty-state__title' }, 'No records yet')
          ),
      })
    );
    expect(code).toBe(
      [
        '<div class="mg-empty-state">',
        '  <h2 class="mg-empty-state__title">No records yet</h2>',
        '</div>',
      ].join('\n')
    );
  });

  it('keeps Storybook source and skips the renderer without html: true', () => {
    const story = () => h('span', { className: 'mg-tag' }, 'Tag');
    const jsx = '<Tag />';
    expect(
      transform(jsx, context({ parameters: {}, originalStoryFn: story }))
    ).toBe(jsx);
    expect(
      transform(
        jsx,
        context({
          parameters: { docs: { source: { html: false } } },
          originalStoryFn: story,
        })
      )
    ).toBe(jsx);
    // No `component` no longer implies HTML.
    expect(
      transform(
        jsx,
        context({
          component: undefined,
          parameters: {},
          originalStoryFn: story,
        })
      )
    ).toBe(jsx);
    expect(load).not.toHaveBeenCalled();
  });

  it('renders HTML for a component story that opts in', async () => {
    await expect(
      transform(
        '<Tag />',
        context({
          component: () => null,
          originalStoryFn: () => h('span', { className: 'mg-tag' }, 'Tag'),
        })
      )
    ).resolves.toBe('<span class="mg-tag">Tag</span>');
  });

  it('keeps inline elements next to adjacent text', async () => {
    const code = await transform(
      '',
      context({
        originalStoryFn: () =>
          h(
            'ul',
            null,
            h('li', null, h('strong', null, 'a'), ': b'),
            h(
              'li',
              null,
              'Read the ',
              h('a', { href: '/report' }, 'Global Assessment Report'),
              ', then share it with colleagues working on disaster risk reduction.'
            )
          ),
      })
    );
    expect(code).toContain('<strong>a</strong>: b');
    expect(code).toContain(
      'Read the <a href="/report">Global Assessment Report</a>, then share'
    );
    expect(code).not.toMatch(/<\/strong>\s+:/);
    expect(code).not.toMatch(/<\/a>\s+,/);
  });

  it('drops the image preloads React adds but keeps the story markup', async () => {
    const code = await transform(
      '',
      context({
        originalStoryFn: () =>
          h(
            'figure',
            null,
            h('img', { src: '/images/flood.jpg', alt: 'Flooded street' }),
            h('img', {
              src: '/images/small.jpg',
              srcSet: '/images/small.jpg 1x, /images/large.jpg 2x',
              alt: '',
            }),
            h('figcaption', null, 'Caption')
          ),
      })
    );
    expect(code).not.toContain('rel="preload"');
    expect(code).toContain('<img src="/images/flood.jpg" alt="Flooded street"');
    expect(code).toContain('<figcaption>Caption</figcaption>');
  });

  it('keeps resource hints the story renders on purpose', () => {
    const markup = [
      '<link rel="preload" as="image" href="/a.png"/>',
      '<link rel="preload" as="image" href="/hero.png"/>',
      '<link rel="preconnect" href="https://example.org"/>',
      '<div><img src="/a.png"/></div>',
    ].join('');
    expect(renderer.stripReactPreloads(markup)).toBe(
      [
        '<link rel="preload" as="image" href="/hero.png"/>',
        '<link rel="preconnect" href="https://example.org"/>',
        '<div><img src="/a.png"/></div>',
      ].join('')
    );
  });

  it('replaces React ids with matching readable placeholders', async () => {
    const Field = ({ label }) => {
      const id = useId();
      return h(
        'div',
        null,
        h('label', { htmlFor: id }, label),
        h('input', { id, 'aria-describedby': `${id}-hint` }),
        h('p', { id: `${id}-hint` }, 'Hint')
      );
    };
    const Story = () => {
      const heading = useId();
      return h(
        'section',
        { 'aria-labelledby': heading },
        h('h2', { id: heading }, 'Sign up'),
        h(Field, { label: 'Email' }),
        h('button', { 'aria-controls': 'fixed-id' }, 'Go'),
        h('div', { id: 'fixed-id' })
      );
    };
    const code = await transform(
      '',
      context({ title: 'Example/Newsletter promotion', originalStoryFn: Story })
    );
    expect(code).not.toMatch(/_R_|mgdocsid/);
    expect(code).toContain('aria-labelledby="newsletter-promotion-1"');
    expect(code).toContain('<h2 id="newsletter-promotion-1">');
    expect(code).toContain('<label for="newsletter-promotion-2">');
    expect(code).toContain('id="newsletter-promotion-2"');
    expect(code).toContain('aria-describedby="newsletter-promotion-2-hint"');
    expect(code).toContain('<p id="newsletter-promotion-2-hint">');
    expect(code).toContain('aria-controls="fixed-id"');
  });

  it('supports stories that use React hooks and the locale global', async () => {
    const Story = (args, { globals }) => {
      const isArabic = globals.locale === 'arabic';
      const [label] = useState(isArabic ? 'منشور' : 'Published');
      return h('span', { dir: isArabic ? 'rtl' : 'ltr' }, label);
    };
    const id = 'test--locale';
    await expect(
      transform('', context({ id, originalStoryFn: Story }))
    ).resolves.toBe('<span dir="ltr">Published</span>');
    await expect(
      transform(
        '',
        context({ id, globals: { locale: 'arabic' }, originalStoryFn: Story })
      )
    ).resolves.toBe('<span dir="rtl">منشور</span>');
  });

  it('falls back to the story source when rendering fails', async () => {
    const source = '{ render: () => <Broken /> }';
    await expect(
      transform(
        source,
        context({
          originalStoryFn: () => {
            throw new Error('needs the live preview');
          },
        })
      )
    ).resolves.toBe(source);
    expect(warn).toHaveBeenCalled();
  });

  it('reuses results for the same story, globals and args', async () => {
    const story = jest.fn(() => h('span', null, 'Cached'));
    const same = context({ originalStoryFn: story });
    await transform('', same);
    await transform('', { ...same });
    expect(story).toHaveBeenCalledTimes(1);

    await transform('', {
      ...same,
      globals: { locale: 'english', theme: 'PW' },
    });
    await transform('', { ...same, args: { size: 'small' } });
    expect(story).toHaveBeenCalledTimes(3);
  });

  it('evicts the least recently used result past the cache size', async () => {
    const small = createSourceTransform({ load, cacheSize: 2 });
    const story = jest.fn(() => h('span', null, 'x'));
    const a = context({ originalStoryFn: story });
    const b = context({ originalStoryFn: story });
    const c = context({ originalStoryFn: story });
    await small('', a);
    await small('', b);
    await small('', a); // a is now most recent
    await small('', c); // evicts b
    expect(story).toHaveBeenCalledTimes(3);
    await small('', a);
    expect(story).toHaveBeenCalledTimes(3);
    await small('', b);
    expect(story).toHaveBeenCalledTimes(4);
  });

  it('does not cache when args hold a React element or function', async () => {
    expect(cacheKey(context({ args: { icon: h('svg') } }))).toBeUndefined();
    expect(cacheKey(context({ args: { onClick: () => {} } }))).toBeUndefined();
    expect(cacheKey(context({ args: { label: 'ok' } }))).toEqual(
      expect.any(String)
    );

    const story = jest.fn(() => h('span', null, 'Uncached'));
    const withElement = context({
      args: { children: h('b', null, 'x') },
      originalStoryFn: story,
    });
    await expect(transform('', withElement)).resolves.toBe(
      '<span>Uncached</span>'
    );
    await transform('', withElement);
    expect(story).toHaveBeenCalledTimes(2);
  });
});
