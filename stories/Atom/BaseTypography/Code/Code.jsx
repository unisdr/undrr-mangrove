import React from 'react';
import PropTypes from 'prop-types';

/**
 * Code renders inline `<code>` snippets in a prose paragraph.
 *
 * For full syntax-highlighted code blocks, use the `CodeBlock` component
 * (Components/CodeBlock) instead.
 */
export const Code = ({ detail1, detail2, detail3, detail4, detail5 }) => {
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
};
