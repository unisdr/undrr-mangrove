import React from 'react';
// import './Container.scss'; // Import the SASS file

export function Container({ children, className }) {
  return <div className={`mg-container ${className || ''}`}>{children}</div>;
}
