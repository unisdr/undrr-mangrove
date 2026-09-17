export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/preset-react',
  ],
  env: {
    // Jest needs CommonJS. Storybook must keep ES modules: its CSF loader
    // runs after Babel and cannot read stories compiled to CommonJS, so
    // docs lose each story's source and "Show code" opens an empty panel.
    test: {
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    },
  },
};
