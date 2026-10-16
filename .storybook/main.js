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
    '@whitespace/storybook-addon-html',
    'storybook-addon-rtl',
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
};
