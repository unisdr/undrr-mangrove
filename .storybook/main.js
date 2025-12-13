import path from 'path';
import webpack from 'webpack';

import { fileURLToPath } from 'url';
import remarkGfm from 'remark-gfm';

// Get the directory path for the current module in ES modules
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

export default {
  staticDirs: ['../stories/assets'],
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],

  //stories: ["../stories/**/CategoriesMenu2.stories.mdx"],
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
    {
      name: 'storybook-design-token',
      options: {
        preserveCSSVars: true,
        // DESIGN_TOKEN_GLOB: "stories/assets/scss/.{scss,svg}"
      },
    },
    '@storybook/addon-links',
    '@whitespace/storybook-addon-html',
    'storybook-addon-rtl',
    '@storybook/addon-a11y',
    '@storybook/addon-webpack5-compiler-babel',
    '@chromatic-com/storybook',
  ],

  webpackFinal: async config => {
    // remove hash from the static file names
    // find the existing rule and override the name property
    // config.module.rules.forEach(function(rule, index) {
    //   if (String(rule.test).search('svg') > 0) {
    //     if (typeof config.module.rules[index].options == 'undefined') {
    //       config.module.rules[index].options = {};
    //     }
    //     config.module.rules[index].options.name = 'static/media/[name].[ext]';
    //   }
    // });
    // SCSS support with lazy loading for theme files (enables hot reload + theme switching)
    // Theme files use lazyStyleTag so we can toggle them on/off
    config.module.rules.push({
      test: /style(-\w+)?\.scss$/,
      exclude: /node_modules/,
      use: [
        { loader: 'style-loader', options: { injectType: 'lazyStyleTag' } },
        'css-loader',
        'sass-loader',
      ],
      include: path.resolve(currentDirPath, '../stories/assets/scss'),
    });

    // Regular SCSS files (component styles, partials, etc.)
    config.module.rules.push({
      test: /\.scss$/,
      exclude: [/node_modules/, /stories\/assets\/scss\/style(-\w+)?\.scss$/],
      use: ['style-loader', 'css-loader', 'sass-loader'],
      include: path.resolve(currentDirPath, '../'),
    });

    // Add polyfills for Node.js core modules (Webpack 5 compatibility)
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.fallback) {
      config.resolve.fallback = {};
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      "tty": false,
      "fs": false,
      "path": false,
      "os": false,
      "process": false,
      "buffer": false,
      "util": false,
      "stream": false,
      "crypto": false,
    };

    // Provide process global for browser compatibility
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env': {},
        'process.version': '"v20.0.0"',
        'process.platform': '"browser"',
      })
    );

    // Silence import warnings
    // https://gitlab.com/undrr/web-backlog/-/issues/2094
    if (!config.ignoreWarnings) {
      config.ignoreWarnings = [];
    }

    config.ignoreWarnings.push({
      message: /Sass @import rules are deprecated/,
    });

    config.ignoreWarnings.push({
      message: /mixed-decls/,
    });

    config.ignoreWarnings.push({
      message: /repetitive deprecation warnings omitted/,
    });

    return config;
  },

  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },

  docs: {
    story: {
      inline: false,
    },
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};
