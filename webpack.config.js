const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
// const RemovePlugin = require('remove-files-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const webpackEntry = require("./webpack.entries");

const packMode = "production";

/*
 * Webpack build for scss and js
 */
module.exports = [
  {
    mode: packMode,
    entry: webpackEntry("css"),
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            {
              loader: "resolve-url-loader",
              options: {
                attempts: 1,
                sourceMap: true,
              },
            },
            {
              loader: "sass-loader",
              options: { sourceMap: true },
            },
          ],
        },
        {
          test: /\.(svg|png|jpg)$/,
          type: "asset",
          generator: {
            filename: "static/media/[name][ext]",
          },
        },
        {
          test: /\.(eot|woff|woff2|ttf)([\?]?.*)$/,
          type: "asset/resource",
          generator: {
            filename: "fonts/[name][ext]",
          },
        },
      ],
    },
    resolve: {
      alias: {
        react: "preact/compat",
        "react-dom/test-utils": "preact/test-utils",
        "react-dom": "preact/compat",
        "react/jsx-runtime": "preact/jsx-runtime",
      },
    },
    optimization: {
      minimizer: [
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              "default",
              {
                discardComments: { removeAll: true },
              },
            ],
          },
        }),
      ],
    },
    plugins: [
      // copying icons folder for better reach
      // to dist folder
      new CopyPlugin({
        patterns: [
          { from: "./stories/assets/icons", to: "images" },
          {
            from: "./stories/assets/images/undrr-logo-(blue|white).svg",
            to: "images/[name][ext]",
          },
          { from: "./stories/assets/fonts", to: "fonts" },
        ],
      }),
      // remove .js file which is generated from every css file
      new FixStyleOnlyEntriesPlugin(),
      new MiniCssExtractPlugin({
        filename: "[name].min.css",
      }),
      // delete fonts from the root directory
      // new RemovePlugin({
      //   after: {
      //     include: [
      //       'fonts',
      //     ],
      //     trash: true,
      //   },
      // }),
    ],
    output: {
      path: path.resolve(__dirname, "docs"),
    },
  },
  {
    mode: packMode,
    entry: webpackEntry("js"),
    output: {
      path: path.resolve(__dirname, "docs"),
      filename: "[name].min.js",
      libraryTarget: "umd",
    },
    externals: {
      jquery: "jQuery",
      Swiper: "Swiper",
      gsap: "gsap",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [["@babel/preset-env"]],
            },
          },
        },
        {
          test: /\.(svg|png|jpg)$/,
          type: "asset",
        },
      ],
    },
  },
  {
    entry: "./stories/Components/Buttons/ShareButtons/ShareButtons.jsx", // Replace with your file's path
    externals: {
      preact: "preact",
      "preact/hooks": "preact/hooks",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.js",
      library: {
        type: "module",
      },
    },
    experiments: {
      outputModule: true,
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                outputPath: "assets/",
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".jsx", ".js", ".svg"],
    },
  },
];
