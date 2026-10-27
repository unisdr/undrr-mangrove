import path from 'node:path';
import { fileURLToPath } from 'node:url';
import CopyPlugin from 'copy-webpack-plugin';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

export default {
  mode: 'development',
  entry: path.join(here, 'src.jsx'),
  output: {
    path: path.join(here, 'dist'),
    filename: 'app.js',
    clean: true,
  },
  resolve: {
    // This maps package imports to the draft tarball's assembled directory.
    // A released consumer removes the alias and installs the package normally.
    alias: { '@undrr/undrr-mangrove': path.join(root, 'npm-package') },
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        include: here,
        use: {
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-env', '@babel/preset-react'] },
        },
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.join(here, 'index.html'), to: 'index.html' },
        { from: path.join(here, 'api'), to: 'api' },
      ],
    }),
  ],
};
