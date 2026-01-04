import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import sassLoader from './.storybook/vite-scss-loader';
import mdxScssPlugin from './.storybook/plugins/vite-plugin-mdx-scss';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

export default defineConfig({
  plugins: [
    viteCommonjs(),
    react({
      // Add JSX runtime options
      jsxRuntime: 'automatic',
      // Explicitly set JSX factory
      jsxImportSource: 'react',
      // Enable JSX in .js files
      include: /\.(jsx|js|ts|tsx)$/,
      // Ensure proper transformation for older browser compatibility
      babel: {
        babelrc: true,
        configFile: true,
      }
    }),
    sassLoader(),
    mdxScssPlugin()
  ],
  
  // Configure esbuild to handle JSX in .js files
  esbuild: {
    loader: {
      '.js': 'jsx',
      '.ts': 'tsx'
    },
    include: /\.(jsx|js|ts|tsx)$/,
    exclude: [],
  },
  resolve: {
    alias: {
      // Add aliases if needed for imports
      '@assets': path.resolve(__dirname, './stories/assets'),
      '@components': path.resolve(__dirname, './stories/Components'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.mdx']
  },
  css: {
    postcss: './postcss.config.js',
    preprocessorOptions: {
      scss: {
        // Include global SCSS files or variables
        includePaths: [path.resolve(__dirname, './stories/assets/scss')],
        // Silence deprecation warnings
        quietDeps: true,
        logger: { silent: true }
      }
    },
    // Disable CSS source maps in development to reduce console noise
    devSourcemap: false
  },
  // Silence deprecation warnings in the Vite logger
  logger: {
    // Filter out SASS warnings
    warn: (msg) => {
      if (
        msg.includes('Sass') || 
        msg.includes('sass') || 
        msg.includes('@import') ||
        msg.includes('mixed-decls') ||
        msg.includes('deprecation') ||
        msg.includes('deprecated') ||
        msg.includes('repetitive')
      ) {
        return;
      }
      console.warn(msg);
    }
  },
  build: {
    // Output directory for production build
    outDir: 'dist',
    // Generate sourcemaps for better debugging
    sourcemap: true,
    // Library configuration for component builds
    lib: {
      entry: {
        ShareButtons: path.resolve(__dirname, 'stories/Components/Buttons/ShareButtons/ShareButtons.jsx'),
        MegaMenu: path.resolve(__dirname, 'stories/Components/MegaMenu/MegaMenu.jsx'),
        ScrollContainer: path.resolve(__dirname, 'stories/Components/ScrollContainer/ScrollContainer.jsx'),
        BarChart: path.resolve(__dirname, 'stories/Components/Charts/BarChart/BarChart.jsx'),
        MapComponent: path.resolve(__dirname, 'stories/Components/Map/MapComponent.jsx'),
        QuoteHighlight: path.resolve(__dirname, 'stories/Components/QuoteHighlight/QuoteHighlight.jsx'),
        Fetcher: path.resolve(__dirname, 'stories/Components/Fetcher/Fetcher.jsx'),
        index: path.resolve(__dirname, 'src/index.js'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    // Rollup options
    rollupOptions: {
      output: {
        // Preserve module structure
        preserveModules: true,
        // Asset handling
        assetFileNames: (assetInfo) => {
          // Keep original directory structure for assets
          if (assetInfo.name) {
            const extType = assetInfo.name.split('.').at(1);
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return 'assets/images/[name][extname]';
            }
            if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
              return 'assets/fonts/[name][extname]';
            }
          }
          return 'assets/[name][extname]';
        }
      },
      // External dependencies that shouldn't be bundled
      external: ['react', 'react-dom']
    }
  },
  // Handle static assets
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.mp4']
});