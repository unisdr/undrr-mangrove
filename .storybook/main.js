const path = require("path");

module.exports = {
  staticDirs: ["../stories/assets"],
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|jsx|ts|tsx)"],

  //stories: ["../stories/**/CategoriesMenu2.stories.mdx"],
  addons: [
    {
      name: "storybook-design-token",
      options: {
        preserveCSSVars: true,
        // DESIGN_TOKEN_GLOB: "stories/assets/scss/.{scss,svg}"
      },
    },
    "@storybook/addon-viewport",
    "@storybook/addon-links",
    "@storybook/addon-actions",
    "@storybook/addon-docs",
    "@storybook/addon-essentials",
    "@whitespace/storybook-addon-html",
    "storybook-addon-rtl",
    "@storybook/addon-a11y",
    "@etchteam/storybook-addon-css-variables-theme",
    "@storybook/addon-webpack5-compiler-babel",
    "@chromatic-com/storybook",
  ],

  webpackFinal: async (config) => {
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
      use: ["style-loader", "css-loader", "sass-loader"],
      include: path.resolve(__dirname, "../"),
    });
    return config;
  },

  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },

  docs: {
    story: {
      inline: false,
    }
  },

  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};
