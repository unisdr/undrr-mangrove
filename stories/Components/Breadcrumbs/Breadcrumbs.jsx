import React from 'react';
import PropTypes from 'prop-types';

/**
 * Renders a breadcrumb navigation trail from an array of link items.
 *
 * @param {Object} props
 * @param {Array<{text: string}>} props.data  Ordered breadcrumb items; the last item is the current page
 * @param {string} [props.Color]              Color variant ('White' applies the white modifier class)
 */
export function Breadcrumbcomponent({ data, Color, ...args }) {
  const lastIndex = data.length - 1;

  let colorClass = '';
  if (Color == 'White') {
    colorClass = 'mg-breadcrumb--white';
  }

  return (
    <nav
      aria-label="breadcrumbs"
      className={['mg-breadcrumb', `${colorClass}`].join(' ').trim()}
    >
      <ul>
        {data.map((item, i) => {
          if (i === lastIndex) {
            return (
              <li key={i} aria-current={item.text}>
                {item.text}
              </li>
            );
          }

          return (
            <li key={i}>
              <a href="#" aria-label={item.text}>
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

Breadcrumbcomponent.propTypes = {
  /** Ordered breadcrumb items; the last item renders as the current page */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
  /** Color variant ('White' applies the white modifier class) */
  Color: PropTypes.string,
};
