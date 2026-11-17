import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));

// Storybook and its Vitest integration share the JSX compatibility settings.
export async function configureVite(config) {
  const { mergeConfig, transformWithEsbuild } = await import('vite');
  const localApiOrigin = process.env.MANGROVE_LOCAL_API_ORIGIN;
  return mergeConfig(config, {
    ...(localApiOrigin && {
      server: {
        proxy: {
          '^/__mg-local-taxonomy([?]|$)': {
            target: localApiOrigin,
            changeOrigin: true,
            rewrite: url =>
              url.replace(/^\/__mg-local-taxonomy/, '/api/v1/taxonomy'),
            configure: proxy => {
              proxy.on('proxyReq', request => {
                request.removeHeader('cookie');
                request.removeHeader('authorization');
              });
            },
          },
        },
      },
    }),
    esbuild: { jsx: 'automatic' },
    optimizeDeps: {
      esbuildOptions: { jsx: 'automatic', loader: { '.js': 'jsx' } },
    },
    plugins: [
      {
        name: 'mangrove-jsx-in-js',
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
