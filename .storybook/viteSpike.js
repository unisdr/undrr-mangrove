import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));

// Loaded only by the opt-in spike scripts. Production remains on Webpack.
export async function configureViteSpike(config) {
  const { mergeConfig, transformWithEsbuild } = await import('vite');
  return mergeConfig(config, {
    esbuild: { jsx: 'automatic' },
    optimizeDeps: {
      esbuildOptions: { jsx: 'automatic', loader: { '.js': 'jsx' } },
    },
    resolve: {
      alias: [
        {
          find: /^\.\/themeStyles$/,
          replacement: path.join(directory, 'themeStyles.vite.js'),
        },
      ],
    },
    plugins: [
      {
        name: 'mangrove-spike-jsx-in-js',
        enforce: 'pre',
        async transform(code, id) {
          if (
            id.startsWith(path.dirname(directory) + '/') &&
            !id.includes('/node_modules/') &&
            id.endsWith('.js')
          ) {
            return transformWithEsbuild(code, id, {
              loader: 'jsx',
              jsx: 'automatic',
            });
          }
        },
      },
    ],
  });
}
