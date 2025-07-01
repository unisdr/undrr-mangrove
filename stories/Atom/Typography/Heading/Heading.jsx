import React from 'react';

export const Heading = ({ detail1, detail2, detail3, detail4, detail5, detail6, className, tabIndex, dataViewport }) => {
  return (
    <div>
      <h1 className={className} tabIndex={tabIndex} data-viewport={dataViewport}>
        {detail1}
      </h1>
      <h2 className={className} tabIndex={tabIndex} data-viewport={dataViewport}>
        {detail2}
      </h2>
      <h3 className={className} tabIndex={tabIndex} data-viewport={dataViewport}>
        {detail3}
      </h3>
      <h4 className={className} tabIndex={tabIndex} data-viewport={dataViewport}>
        {detail4}
      </h4>
      <h5 className={className} tabIndex={tabIndex} data-viewport={dataViewport}>
        {detail5}
      </h5>
      <h6 className={className} tabIndex={tabIndex} data-viewport={dataViewport}>
        {detail6}
      </h6>
    </div>
  );
};
