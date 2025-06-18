import React, { useState } from 'react';
// import './accordion.scss';
import { P } from '../../Atom/BaseTypography/Paragraph/Paragraph';

/**
 * @deprecated This component was part of the initial import from the UNDP implementation
 * and is likely to be either heavily modified or deleted. It is not part of the current
 * UNDRR distribution.
 */

export function Accordion({ headerText, descriptionText }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = index => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const accordionItems = [
    { header: headerText, content: descriptionText },
    { header: headerText, content: descriptionText },
    { header: headerText, content: descriptionText },
  ];

  return (
    <ul className="accordion" aria-label="accordion">
      {accordionItems.map((item, index) => (
        <li key={index}>
          <button
            tabIndex="0"
            aria-expanded={activeIndex === index}
            className={activeIndex === index ? 'accordion--active' : ''}
            onClick={() => toggleAccordion(index)}
          >
            {item.header}
          </button>
          <div
            className="accordion__panel"
            aria-hidden={activeIndex !== index}
            role="region"
            style={{ display: activeIndex === index ? 'block' : 'none' }}
          >
            <P label={item.content} />
            <P label={item.content} />
          </div>
        </li>
      ))}
    </ul>
  );
}
