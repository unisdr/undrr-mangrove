import path from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import FixStyleOnlyEntriesPlugin from 'webpack-fix-style-only-entries';
import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import webpackEntry from './webpack.entries.js';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

const packMode =
  process.env.NODE_ENV === 'development' ? 'development' : 'production';
const analyzeBundle = process.env.ANALYZE === 'true';

export default [
  {
    mode: packMode,
    cache: { type: 'filesystem' },
    entry: webpackEntry('js'),
    output: {
      path: path.resolve(currentDirPath, 'dist'),
      filename: '[name].min.js',
      libraryTarget: 'umd',
    },
    externals: {},
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: [['@babel/preset-env']],
            },
          },
        },
        {
          test: /\.(svg|png|jpg)$/,
          type: 'asset',
        },
      ],
    },
    optimization: {
      minimize: packMode === 'production', // Minimize only in production mode
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
        patterns: [
          { from: 'stories/assets', to: 'assets' },
          {
            from: 'stories/Components/ErrorPages/static',
            to: 'assets/error-pages',
          },
          {
            from: 'stories/assets/fonts/mangrove-icon-set',
            to: 'fonts/mangrove-icon-set',
          },
        ],
      }),
    ],
  },
  {
    mode: packMode, // Set mode dynamically
    cache: { type: 'filesystem' },
    entry: {
      ShareButtons:
        './stories/Components/Buttons/ShareButtons/ShareButtons.jsx',
      MegaMenu: './stories/Components/MegaMenu/MegaMenu.jsx',
      ScrollContainer:
        './stories/Components/ScrollContainer/ScrollContainer.jsx',
      BarChart: './stories/Components/Charts/BarChart/BarChart.jsx',
      MapComponent: './stories/Components/Map/MapComponent.jsx',
      QuoteHighlight: './stories/Components/QuoteHighlight/QuoteHighlight.jsx',
      Fetcher: './stories/Components/Fetcher/Fetcher.jsx',
      SyndicationSearchWidget:
        './stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.jsx',
      IconCard: './stories/Components/Cards/IconCard/IconCard.jsx',
      Gallery: './stories/Components/Gallery/Gallery.jsx',
      StatsCard: './stories/Components/Cards/StatsCard/StatsCard.jsx',
      Pager: './stories/Components/Pager/Pager.jsx',
    },
    externals: {
      react: 'react',
      'react-dom': 'react-dom',
    },
    output: {
      path: path.resolve(currentDirPath, 'dist/components'),
      filename: '[name].js',
      library: {
        type: 'module',
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
      ...(analyzeBundle ? [new BundleAnalyzerPlugin()] : []),
    ],
    experiments: {
      outputModule: true,
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          resolve: {
            // Allow extensionless imports (e.g. '../context/SearchContext')
            // despite package.json "type": "module".
            fullySpecified: false,
          },
          use: {
            loader: 'babel-loader',
            options: {
              // Ignore project-level .babelrc.json and babel.config.js so
              // the ESM component bundles don't get core-js polyfill
              // require() calls injected by babel-plugin-polyfill-corejs3.
              cacheDirectory: true,
              configFile: false,
              babelrc: false,
              presets: [['@babel/preset-react', { runtime: 'automatic' }]],
            },
          },
        },
        {
          test: /\.(css|scss|sass)$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                outputPath: 'assets/',
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.jsx', '.js', '.svg'],
    },
  },
];
