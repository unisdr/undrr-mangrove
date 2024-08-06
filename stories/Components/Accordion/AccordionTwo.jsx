import React, { useState } from "react";
import { P } from "../../Atom/BaseTypography/Paragraph/Paragraph";

export function AccourdionTwo({ headerText, descriptionText }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleAccourdionTwoToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <ul className="accordion" aria-label="accordion">
      {[...Array(3)].map((_, index) => (
        <li key={index}>
          <button
            style={{ paddingLeft: "10px" }}
            tabIndex={0}
            aria-expanded={activeIndex === index}
            className={activeIndex === index ? "accordion--active" : ""}
            onClick={() => handleAccourdionTwoToggle(index)}
          >
            {headerText}
          </button>
          <div
            className={`accordion__panel ${
              activeIndex === index ? "accordion--active" : ""
            }`}
            aria-hidden={activeIndex !== index}
            role="region"
            style={{
              display: activeIndex === index ? "block" : "none",
              transition: "max-height 0.3s ease-out",
              maxHeight: activeIndex === index ? "200px" : "0px",
              overflow: "hidden",
            }}
          >
            <P label={descriptionText} />
            <P label={descriptionText} />
          </div>
        </li>
      ))}
    </ul>
  );
}
