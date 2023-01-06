import React from 'react';
import './select.scss';

function Select({ text }) {
  return (
    <select className="select-default" tabIndex="-1" aria-label="Select list">
      <option>1</option>
      <option>2</option>
    </select>
  );
}

export default Select;
