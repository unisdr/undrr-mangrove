import React from 'react';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';
import { I18nProvider } from 'react-aria-components';

import { transformSource } from './docsSource';

import { addons } from 'storybook/preview-api';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';
import { applyTheme, themeNames } from './themeStyles';

import { applyLanguage, resolveLanguage } from './language';

const getLangCode = (Story, context) => {
  React.useLayoutEffect(() => {
    // Embedded docs canvases can finish rendering an older globals snapshot
    // after the docs globals listener has applied a newer toolbar selection.
    // They own only their canvas; the listener owns the docs document/runtime.
    applyLanguage(context.globals, context.canvasElement, {
      previewDocument: context.viewMode !== 'docs',
    });
  });

  React.useEffect(() => {
    // Preserve the existing initialization signal for vanilla components.
    const timer = setTimeout(() => window.dispatchEvent(new Event('load')), 10);
    return () => clearTimeout(timer);
  }, [context.globals.locale, context.globals.addonRtl]);

  // React Aria derives its own locale and reading direction from useLocale(),
  // which falls back to navigator.language and never inspects the dir we set
  // above. Without this provider the page is visually RTL while React Aria
  // still believes it is LTR, so DateField segment order and the
  // direction-dependent arrow-key mapping in Tabs, Slider, DateField and Table
  // run backwards against the layout.
  return (
    <I18nProvider locale={resolveLanguage(context.globals).lang}>
      <Story {...context} />
    </I18nProvider>
  );
};

const sbFrameReset = (Story, context) => {
  const iframeBody = document.querySelector('body');
  const sidebarItem = parent.document.querySelectorAll('.sidebar-item');

  sidebarItem.forEach(function resetSidebarItem(item) {
    item.addEventListener('click', function resetIframeBody() {
      const classNames = ['sdgmodal-open', 'color-blue'];
      if (
        classNames.some(className => iframeBody.classList.contains(className))
      ) {
        iframeBody.classList.remove(...classNames);
      }
    });
  });

  return <Story {...context} />;
};

// Docs-only pages do not run story decorators/loaders. Listen to the public
// globals channel as well so toolbar changes update theme, language and direction.
const channel = addons.getChannel();
const updatePreviewGlobals = ({ globals }) => {
  applyLanguage(globals);
  applyTheme(globals.theme).catch(error =>
    console.error('Theme loading failed', error)
  );
};
channel.on(GLOBALS_UPDATED, updatePreviewGlobals);
const initialThemeReady = applyTheme();
if (import.meta.hot) {
  import.meta.hot.dispose(() =>
    channel.off(GLOBALS_UPDATED, updatePreviewGlobals)
  );
}

/** @type { import('storybook').Preview } */
const preview = {
  beforeAll: async () => {
    await initialThemeReady;
  },
  loaders: [
    async ({ globals, canvasElement, viewMode }) => {
      applyLanguage(globals, canvasElement, {
        previewDocument: viewMode !== 'docs',
      });
      await applyTheme(globals.theme);
      return {};
    },
  ],
  parameters: {
    // `@storybook/addon-a11y` is registered in main.js with no configuration,
    // so it ran axe's default rule set. That set includes `best-practice`
    // rules, which are advisory conventions rather than WCAG success
    // criteria, and it runs over everything in the story — including markup
    // from third-party embeds such as YouTube iframes, which this library
    // neither writes nor can fix. The panel's output therefore read as a
    // count of accessibility failures in Mangrove while being nothing of the
    // sort. Scoping to the WCAG tags makes it mean what people already assume
    // it means. See unisdr/undrr-mangrove#1273.
    //
    // `test: 'todo'` preserves the existing advisory policy: the
    // addon reports in the panel and beside the test runner's output but does
    // not fail a build. Turning it to `'error'` is a decision for #1273,
    // after the existing findings have been triaged — not a side effect of
    // switching the test runner on.
    a11y: {
      test: 'todo',
      // `runOnly` is an axe *run* option, so it belongs under `options` —
      // putting it in `config` is accepted silently and changes nothing.
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        },
      },
    },
    actions: {
      argTypes: {
        onClick: { action: 'clicked' },
        onChange: { action: 'changed' },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    designToken: {
      defaultTab: 'Colors',
      disable: true,
    },
    html: {
      removeComments: true,
    },
    docs: {
      source: {
        format: 'dedent',
        // Story files with docs.source.html: true show rendered HTML.
        transform: transformSource,
      },
    },
    viewport: {
      viewports: INITIAL_VIEWPORTS,
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Introduction',
          'Brand',
          [
            'About this guide',
            'Brand identity',
            'Brand guidelines',
            'Common patterns',
            'Component gallery',
          ],
          'Getting started',
          [
            'About Mangrove',
            'Getting started guide',
            'Integration',
            [
              'Vanilla HTML and CSS',
              'Sass integration',
              'React integration',
              'Theming guide',
              'CDN reference',
              'Hydration guide',
              'Drupal Gutenberg',
            ],
            'Best practices',
            'Accessibility',
            'Browser support',
            'AI and MCP integration',
          ],
          'Contributing',
          [
            'Component standards',
            'Build a component',
            ['Step by step', 'Review checklist', 'Testing', 'Hydration'],
            'Writing guidelines',
            'Architecture',
            'Release process',
          ],
          'Platform services',
          [
            'Analytics enhancements',
            'Critical messaging',
            'Cookie consent',
            'Content syndication',
            'Search syndication',
          ],
          'Design decisions',
          'Components',
          'Patterns',
          ['Content', ['Overview', '*'], '*'],
          'Utilities',
        ],
        includeName: true,
      },
    },
  },

  initialGlobals: {
    addonRtl: 'ltr',
  },

  globalTypes: {
    addonRtl: {
      name: 'Direction',
      description: 'Text direction',
      toolbar: {
        icon: 'transfer',
        items: [
          { value: 'ltr', title: 'Locale direction' },
          { value: 'rtl', title: 'Force right-to-left' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      name: 'Locale',
      description: 'locale',
      defaultValue: 'english',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'english', title: 'English' },
          { value: 'arabic', title: 'Arabic' },
          { value: 'french', title: 'French' },
          { value: 'japanese', title: 'Japanese' },
          { value: 'russian', title: 'Russian' },
          { value: 'spanish', title: 'Spanish' },
          { value: 'chinese', title: 'Simplified Chinese' },
        ],
      },
    },
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'Global UNDRR Theme',
      toolbar: {
        icon: 'paintbrush',
        items: themeNames.map(name => ({
          value: name,
          title: name,
        })),
        showName: true,
        dynamicTitle: true,
      },
    },
  },

  decorators: [getLangCode, sbFrameReset],

  tags: ['autodocs'],
};

export default preview;
