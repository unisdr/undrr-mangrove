import React from 'react';
import './details.scss';

export function DetailsTag({ summary, details }) {
  return (
    <details>
      <summary>
        {summary}
      </summary>
      <p>{details}</p>
    </details>
  );
}
