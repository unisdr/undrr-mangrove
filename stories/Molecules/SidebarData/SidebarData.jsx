import React from 'react';
// import './sidebar-data.scss';

export function Sidebardata({ data, headerText }) {
  return (
    <>
      <a href="#">{headerText}</a>
      <button tabIndex="0" aria-expanded="false" aria-label="button" />
      <ul className="accordion__panel">
        {data.map((item, index) => (
          <li key={index}>
            <a href="#">{item.descriptionText}</a>
          </li>
        ))}
      </ul>
    </>
  );
}
