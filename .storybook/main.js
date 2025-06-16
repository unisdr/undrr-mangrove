import path from 'path';

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
    '@etchteam/storybook-addon-css-variables-theme',
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
    // add SCSS support for CSS Modules
    config.module.rules.push({
      test: /\.scss$/,
      exclude: /node_modules/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
      include: path.resolve(currentDirPath, '../'),
    });

    // Silience import warnings
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
