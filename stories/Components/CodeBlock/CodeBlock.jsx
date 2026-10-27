import React from 'react';
import PropTypes from 'prop-types';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';

SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('jsx', jsx);

/**
 * CodeBlock renders a syntax-highlighted code block.
 *
 * - Without `language`: plain dark block (`<pre><code>`).
 * - With `language`: syntax highlighted via react-syntax-highlighter (PrismLight).
 * - With `filename`: wraps in `<figure class="mg-code-block">` with a
 *   `<figcaption>` filename header.
 * - With `lineNumbers`: shows gutter line numbers (requires `language`).
 *
 * For inline `<code>` snippets inside prose, use the bare `<code>` element
 * directly — no component needed.
 */
export const CodeBlock = ({ code, language, filename, lineNumbers }) => {
  const block = language ? (
    <SyntaxHighlighter
      language={language}
      useInlineStyles={false}
      showLineNumbers={lineNumbers}
      wrapLines={lineNumbers}
    >
      {code}
    </SyntaxHighlighter>
  ) : (
    <pre>
      <code>{code}</code>
    </pre>
  );

  if (filename) {
    return (
      <figure className="mg-code-block">
        <figcaption>{filename}</figcaption>
        {block}
      </figure>
    );
  }

  return block;
};

CodeBlock.propTypes = {
  /** The source code string to display */
  code: PropTypes.string.isRequired,
  /** Syntax highlighting language. Omit for a plain dark block. */
  language: PropTypes.oneOf(['bash', 'javascript', 'jsx']),
  /** Optional filename shown in the header bar above the block */
  filename: PropTypes.string,
  /** Show line numbers in the gutter. Requires `language` to be set. */
  lineNumbers: PropTypes.bool,
};
