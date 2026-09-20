import path from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import { DEV_ONLY_GLOBS } from './scripts/assemble-npm-package.mjs';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

const packMode =
  process.env.NODE_ENV === 'development' ? 'development' : 'production';
const analyzeBundle = process.env.ANALYZE === 'true';

export default [
  {
    mode: packMode,
    cache: { type: 'filesystem', name: `assets-${packMode}` },
    // The asset pass: it compiles nothing and exists for the CopyPlugin
    // patterns below, which are what put the vanilla modules, the compiled
    // CSS, the fonts and the error pages into dist/assets/.
    //
    // It used to take glob-discovered entries from webpack.entries.js and
    // was documented as emitting dist/js/*.min.js, but the glob doubled a
    // path segment and matched nothing, so no such bundle was ever emitted
    // and nothing consumes one: the npm `js/` directory and the CDN both
    // serve the unminified copies CopyPlugin makes. See
    // unisdr/undrr-mangrove#1253.
    entry: {},
    output: {
      // Only `path` matters here: it is where CopyPlugin writes. The
      // `[name].min.js` filename and the UMD library target that used to sit
      // beside it described the bundle this config never emitted, so they
      // named a format nothing in the repository has ever produced.
      path: path.resolve(currentDirPath, 'dist'),
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
      // DO NOT DELETE THIS LIST. It is load-bearing even with no entry,
      // because minimizers run over every asset CopyPlugin emits, not just
      // over bundles.
      //
      // webpack 5's default list minifies JS, CSS *and* HTML. Replacing it
      // with CssMinimizerPlugin alone is what makes the copied assets what
      // the CDN and the npm `js/` directory actually serve today:
      //  - dist/assets/js/*.js stay byte for byte what a contributor wrote,
      //    because no JS minifier is in the list;
      //  - dist/assets/error-pages/*.html and the icon-font demo page stay
      //    readable, because no HTML minifier is in the list;
      //  - dist/assets/css/*.css keep their header comment, because of
      //    `discardComments: false` below.
      // Deleting the list does not merely stop minifying the CSS — it
      // silently starts minifying the published JS and HTML as well.
      // Verified by building both ways: every file under dist/assets/js,
      // dist/assets/error-pages and dist/assets/css changes.
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
      new CopyPlugin({
        // These copy whole source trees, so Jest specs that sit beside the
        // sources would otherwise land in dist/ and from there in the npm
        // tarball and every versioned CDN folder. See issue
        // unisdr/undrr-mangrove#1218.
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
        ].map(pattern => ({
          ...pattern,
          globOptions: { ignore: DEV_ONLY_GLOBS },
        })),
      }),
    ],
  },
  {
    mode: packMode, // Set mode dynamically
    cache:
      packMode === 'development'
        ? { type: 'filesystem', name: 'components-development' }
        : false,
    entry: {
      hydrate: './src/hydrate.js',
      // Drupal-integrated components (hydration + npm)
      ShareButtons:
        './stories/Components/Buttons/ShareButtons/ShareButtons.hydrate.js',
      MegaMenu: './stories/Components/MegaMenu/MegaMenu.hydrate.js',
      ScrollContainer:
        './stories/Components/ScrollContainer/ScrollContainer.hydrate.js',
      UserFeedback: './stories/Components/UserFeedback/UserFeedback.hydrate.js',
      QuoteHighlight:
        './stories/Components/QuoteHighlight/QuoteHighlight.hydrate.js',
      SyndicationSearchWidget:
        './stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.hydrate.js',
      IconCard: './stories/Components/Cards/IconCard/IconCard.hydrate.js',
      Gallery: './stories/Components/Gallery/Gallery.hydrate.js',
      StatsCard: './stories/Components/Cards/StatsCard/StatsCard.hydrate.js',
      Pager: './stories/Components/Pager/Pager.hydrate.js',
      TextCta: './stories/Components/TextCta/TextCta.hydrate.js',
      CopyButton:
        './stories/Components/Buttons/CopyButton/CopyButton.hydrate.js',
      Drawer: './stories/Components/Navigation/Drawer/Drawer.hydrate.js',
      Tree: './stories/Components/Navigation/Tree/Tree.hydrate.js',
      ServiceNotice:
        './stories/Components/ServiceNotice/ServiceNotice.hydrate.js',
      Notice: './stories/Components/Notice/Notice.hydrate.js',
      // Vanilla components (bundled for AI manifest auto-rendering)
      Chips: './stories/Components/Buttons/Chips/Chips.jsx',
      CtaButton: './stories/Components/Buttons/CtaButton/CtaButton.entry.js',
      TextInput: './stories/Components/Forms/TextInput/TextInput.jsx',
      Select: './stories/Components/Forms/Select/Select.jsx',
      Checkbox: './stories/Components/Forms/Checkbox/Checkbox.jsx',
      Radio: './stories/Components/Forms/Radio/Radio.jsx',
      SegmentedControl:
        './stories/Components/Forms/SegmentedControl/SegmentedControl.jsx',
      Textarea: './stories/Components/Forms/Textarea/Textarea.jsx',
      FormGroup: './stories/Components/Forms/FormGroup/FormGroup.jsx',
      FormErrorSummary:
        './stories/Components/Forms/FormErrorSummary/FormErrorSummary.jsx',
      FormAction: './stories/Components/Forms/FormAction/FormAction.jsx',
      VerticalCard: './stories/Components/Cards/Card/VerticalCard.jsx',
      HorizontalCard: './stories/Components/Cards/Card/HorizontalCard.jsx',
      BookCard: './stories/Components/Cards/Card/BookCard.jsx',
      HorizontalBookCard:
        './stories/Components/Cards/Card/HorizontalBookCard.jsx',
      Breadcrumbs: './stories/Components/Breadcrumbs/Breadcrumbs.jsx',
      Tab: './stories/Components/Tab/Tab.jsx',
      Hero: './stories/Components/Hero/Hero.jsx',
      PageHeader: './stories/Components/PageHeader/PageHeader.jsx',
      Footer: './stories/Components/Footer/Footer.jsx',
      HighlightBox: './stories/Components/HighlightBox/HighlightBox.jsx',
      EmbedContainer: './stories/Utilities/EmbedContainer/EmbedContainer.jsx',
      FullWidth: './stories/Utilities/FullWidth/FullWidth.jsx',
      Loader: './stories/Utilities/Loader/Loader.jsx',
      ShowMore: './stories/Utilities/ShowMore/ShowMore.jsx',
      SkipLink: './stories/Utilities/SkipLink/SkipLink.entry.js',
      Range: './stories/Components/Forms/Range/Range.jsx',
      Legend: './stories/Components/DataViz/Legend/Legend.jsx',
    },
    externals: {
      react: 'react',
      'react-dom': 'react-dom',
      'react-dom/client': 'react-dom/client',
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
        banner: `UNDRR Mangrove component library
Storybook:    https://mangrove.undrr.org/
LLMs context: https://mangrove.undrr.org/llms.txt
Repository:   https://github.com/unisdr/undrr-mangrove
Compiled on:  ${new Date().toISOString()}`,
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
              cacheDirectory: packMode === 'development',
              configFile: false,
              babelrc: false,
              presets: [
                [
                  '@babel/preset-react',
                  {
                    runtime: 'automatic',
                    development: packMode === 'development',
                  },
                ],
              ],
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
