import * as prettier from 'prettier/standalone';
import * as htmlPlugin from 'prettier/plugins/html';

/**
 * Format HTML with Prettier.
 *
 * `htmlWhitespaceSensitivity: 'css'` keeps inline elements next to their text
 * (`<strong>a</strong>: b`); 'ignore' would add whitespace that renders.
 *
 * @param {string} html HTML to format.
 * @returns {Promise<string>} Formatted HTML.
 */
export const formatHtml = async html =>
  (
    await prettier.format(html, {
      parser: 'html',
      plugins: [htmlPlugin],
      printWidth: 80,
      tabWidth: 2,
      htmlWhitespaceSensitivity: 'css',
    })
  ).trim();
