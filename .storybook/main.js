import { fileURLToPath } from 'node:url';
import remarkGfm from 'remark-gfm';

export default {
  staticDirs: ['../stories/assets'],
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],

  addons: [
    // https://storybook.js.org/docs/writing-docs/mdx#markdown-tables-arent-rendering-correctly
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    '@storybook/addon-links',
    fileURLToPath(new URL('./addons/html/preset.js', import.meta.url)),
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@chromatic-com/storybook',
  ],

  viteFinal: async config => {
    const { configureVite } = await import('./viteConfig.js');
    return configureVite(config);
  },

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  features: {
    componentsManifest: true,
  },

  docs: {
    story: {
      inline: false,
    },
  },

  typescript: {
    // Use react-docgen for faster builds (handles basic TS types)
    // Switch to 'react-docgen-typescript' if props tables are missing or incomplete for TS components
    reactDocgen: 'react-docgen',
  },
  storySorts: [
    {
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
  ],
};
