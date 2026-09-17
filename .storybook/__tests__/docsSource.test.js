import React, { useState } from 'react';
import * as prettier from 'prettier/standalone';
import * as htmlPlugin from 'prettier/plugins/html';
import { createSourceTransform } from '../docsSource';

const h = React.createElement;

// The Storybook bundle loads Prettier with a dynamic import, which Jest cannot
// run without experimental VM modules, so inject the same formatter.
const format = html =>
  prettier.format(html, {
    parser: 'html',
    plugins: [htmlPlugin],
    printWidth: 80,
    htmlWhitespaceSensitivity: 'ignore',
  });

let storyCount = 0;
const context = overrides => {
  storyCount += 1;
  return {
    id: `test--story-${storyCount}`,
    args: {},
    globals: { locale: 'english' },
    parameters: {},
    ...overrides,
  };
};

describe('docs source transform', () => {
  let transform;
  let warn;

  beforeEach(() => {
    transform = createSourceTransform({ format });
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => warn.mockRestore());

  it('renders CSS-only stories to formatted HTML', async () => {
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

  it('keeps JSX for stories of a React component', () => {
    const jsx = '<Pager page={3} />';
    expect(
      transform(
        jsx,
        context({ component: () => null, originalStoryFn: () => h('div') })
      )
    ).toBe(jsx);
  });

  it('honours the html parameter override', async () => {
    const jsx = '<Tag />';
    const story = () => h('span', { className: 'mg-tag' }, 'Tag');
    expect(
      transform(
        jsx,
        context({
          parameters: { docs: { source: { html: false } } },
          originalStoryFn: story,
        })
      )
    ).toBe(jsx);
    await expect(
      transform(
        jsx,
        context({
          component: () => null,
          parameters: { docs: { source: { html: true } } },
          originalStoryFn: story,
        })
      )
    ).resolves.toBe('<span class="mg-tag">Tag</span>');
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
});
