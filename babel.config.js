export default api => {
  // Keyed off the Babel caller, not BABEL_ENV or NODE_ENV, so a shell that
  // exports either variable can neither break Jest nor change Storybook.
  // `api.caller` also makes Babel cache the config per caller.
  const isJest = api.caller(caller => caller?.name === 'babel-jest');

  return {
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
    // Jest needs CommonJS. Storybook (babel-loader) must keep ES modules: its
    // CSF loader runs after Babel and cannot read stories compiled to
    // CommonJS, so docs lose each story's source and "Show code" opens an
    // empty panel.
    plugins: isJest ? ['@babel/plugin-transform-modules-commonjs'] : [],
  };
};
