import React from 'react';
// import './Container.scss'; // Import the SASS file

export function Container({ children }) {
  return <div className="mg-container mg-container--spacer">{children}</div>;
}
