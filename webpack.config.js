const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const CopyPlugin = require("copy-webpack-plugin");
const webpackEntry = require("./webpack.entries");

const packMode =
  process.env.NODE_ENV === "development" ? "development" : "production";

module.exports = [
  {
    mode: packMode, // Set mode dynamically
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
      minimizer: [new CssMinimizerPlugin()], // Minimize only in production mode
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
      MegaMenuSimple: "./stories/Components/MegaMenu/MegaMenuSimple.jsx",
      BarChart: "./stories/Components/Charts/BarChart/BarChart.jsx",
      MapComponent: "./stories/Components/Map/MapComponent.jsx",
      Fetcher: "./stories/Components/Fetcher/Fetcher.jsx",
    },
    externals: {
      react: "react",
      "react-dom": "react-dom",
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
