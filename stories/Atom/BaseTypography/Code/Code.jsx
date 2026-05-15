import React from 'react';
import PropTypes from 'prop-types';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';

SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('jsx', jsx);

export const Code = ({ detail1, detail2, detail3, detail4, detail5, blockCode, language }) => {
  if (blockCode) {
    if (language) {
      return (
        <SyntaxHighlighter language={language} useInlineStyles={false}>
          {blockCode}
        </SyntaxHighlighter>
      );
    }
    return (
      <pre>
        <code className="mg-code--block">{blockCode}</code>
      </pre>
    );
  }

  return (
    <p>
      {detail1} <code>{detail2}</code> {detail3} <code>{detail4}</code> {detail5}
    </p>
  );
};

Code.propTypes = {
  detail1: PropTypes.string,
  detail2: PropTypes.string,
  detail3: PropTypes.string,
  detail4: PropTypes.string,
  detail5: PropTypes.string,
  blockCode: PropTypes.string,
  language: PropTypes.oneOf(['bash', 'javascript', 'jsx']),
};
