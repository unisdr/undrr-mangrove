const path = require('path');
const glob = require('glob');

const cssPathPrefix = 'css';

/*
 * Get entry points for webpack
 * CSS and JS separately
 */
module.exports = (type = 'css') => {
  let files = {};
  let suggestFiles = '/**/*.scss';
  let ignoreFiles = [
    './node_modules',
    './stories/assets/**/lib/**',
    './stories/**/_!(swiper)*.scss',
    './stories/Atom/**',
    './stories/**/*.mdx',
    './stories/**/*.jsx',
  ];

  if (type == 'js') {
    suggestFiles = '/stories/assets/**/*.js';
  }

  glob
    .globSync(`./stories${suggestFiles}`, {
      ignore: ignoreFiles,
      nodir: true,
    })
    .forEach(file => {
      let fileName = path.basename(file, path.extname(file));
      let objKey = `${cssPathPrefix}/components/${fileName}`;

      if (type == 'js') {
        objKey = `js/${fileName}`;
      }

      if (file.indexOf('Templates') > 0) {
        objKey = `${cssPathPrefix}/templates/${fileName}`;
      }

      if (file.indexOf('assets/scss') > 0) {
        objKey = `${cssPathPrefix}/${fileName}`;
      }

      if (file.indexOf('/_') > 0) {
        fileName = fileName.replace(/[_]/g, '');
        objKey = `${cssPathPrefix}/components/${fileName}`;
      }

      files[objKey] = file;
    });

  return files;
};
