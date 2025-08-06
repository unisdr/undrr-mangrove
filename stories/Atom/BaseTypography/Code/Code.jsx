import React from 'react';

export const Code = ({ detail1, detail2, detail3, detail4, detail5, blockCode }) => {
  if (blockCode) {
    return (
      <pre>
        <code className="mg-code--block">{blockCode}</code>
      </pre>
    );
  }

  return (
    <p>
      {detail1} <code>{detail2}</code> {detail3} <code>{detail4}</code> {detail5}
    </p>
  );
};
