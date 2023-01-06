import React from 'react';

export function Descriptionlist({ data }) {
  return (
    <dl>
      {data.map((item, index) => (
        <React.Fragment key={index}>
          <dt>{item.label}</dt>
          <dd>{item.text}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
