import React from 'react';

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
