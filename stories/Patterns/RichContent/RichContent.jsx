import React from 'react';
import PropTypes from 'prop-types';
import { EDITORIAL_HTML } from './rich-content-fixtures';

/** Story specimen only: consumers emit trusted editorial HTML with CSS. */
export function RichContent({ dir = 'ltr' }) {
  return (
    <article
      id="rich-content-demo"
      className="mg-content"
      dir={dir}
      // eslint-disable-next-line react/no-danger -- constant authored editorial specimen; production content remains caller-sanitised
      dangerouslySetInnerHTML={{ __html: EDITORIAL_HTML }}
    />
  );
}

RichContent.propTypes = {
  /** Logical direction supplied by the surrounding publication. */
  dir: PropTypes.oneOf(['ltr', 'rtl']),
};
