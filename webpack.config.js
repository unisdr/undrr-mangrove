const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
// const RemovePlugin = require('remove-files-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const webpackEntry = require("./webpack.entries");

const packMode = "development";

/*
 * Webpack build for scss and js
 */
module.exports = [
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
    mode: 'development',
    entry: {
      ShareButtons:
        "./stories/Components/Buttons/ShareButtons/ShareButtons.jsx",
      MegaMenu: "./stories/Components/MegaMenu/MegaMenu.jsx",
      MegaMenuSimple: "./stories/Components/MegaMenu/MegaMenuSimple.jsx",
      BarChart: "./stories/Components/Charts/BarChart/BarChart.jsx",
      MapComponent: "./stories/Components/Map/MapComponent.jsx",
      Fetcher: "./stories/Components/Fetcher/Fetcher.jsx",
    },
    externals: {
      // If want externals, leave them here.
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
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
            options: {
              presets: [["@babel/preset-react", { runtime: "automatic" }]], // Ensure React is supported
            },
          },
        },
        {
          test: /\.(css|scss|sass)$/,
          use: ["style-loader", "css-loader", "sass-loader"],
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
