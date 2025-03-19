const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const webpackEntry = require("./webpack.entries");

const packMode =
  process.env.NODE_ENV === "development" ? "development" : "production";

module.exports = [
  {
    mode: packMode,
    entry: webpackEntry("js"),
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].min.js",
      libraryTarget: "umd",
    },
    externals: {
      jquery: "jQuery",
      Swiper: "Swiper",
      gsap: "gsap",
      fitty: "fitty",
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
    optimization: {
      minimize: packMode === "production", // Minimize only in production mode
          minimizer: [
            new CssMinimizerPlugin({
              minimizerOptions: {
                preset: [
                  'default',
                  {
                    discardComments: false,
                  },
                ],
              },
            }),
          ],
    },
    plugins: [
      new MiniCssExtractPlugin(),
      //new FixStyleOnlyEntriesPlugin(),
      new CopyPlugin({
        patterns: [{ from: "stories/assets", to: "assets" }],
      }),
    ],
  },
  {
    mode: packMode, // Set mode dynamically
    entry: {
      ShareButtons:
        "./stories/Components/Buttons/ShareButtons/ShareButtons.jsx",
      MegaMenu: "./stories/Components/MegaMenu/MegaMenu.jsx",
      ScrollContainer: "./stories/Components/ScrollContainer/ScrollContainer.jsx",
      BarChart: "./stories/Components/Charts/BarChart/BarChart.jsx",
      MapComponent: "./stories/Components/Map/MapComponent.jsx",
      Fetcher: "./stories/Components/Fetcher/Fetcher.jsx",
    },
    externals: {
      react: "react",
      "react-dom": "react-dom",
    },
    output: {
      path: path.resolve(__dirname, "dist/components"),
      filename: "[name].js",
      library: {
        type: "module",
      },
    },
    plugins: [
      new webpack.BannerPlugin({
        banner: `This is a UNDRR Mangrove component: https://github.com/unisdr/undrr-mangrove?tab=readme-ov-file
Compiled on: ${new Date().toISOString()}`,
        raw: false,
        entryOnly: false,
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
      }),
    ],
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
              presets: [["@babel/preset-react", { runtime: "automatic" }]],
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