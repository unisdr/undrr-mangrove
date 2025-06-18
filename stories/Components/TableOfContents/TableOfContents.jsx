import React, { useEffect, useRef } from 'react';
import { mgTableOfContents } from './js/TableOfContentsVanillaJs';

export default function TableOfContents({
  tocData,
  showNumbers = false,
  title = 'On this page',
}) {
  const ListComponent = showNumbers ? 'ol' : 'ul';

  const contentRef = useRef(null);
  const tocRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && tocRef.current) {
      mgTableOfContents(contentRef.current, tocRef.current);
    }
  }, []);

  // Handle anchor link clicks to prevent full page navigation in Storybook/React
  const handleAnchorClick = (e, targetId) => {
    e.preventDefault();

    // Find the target element
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      // Smooth scroll to the target element
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      // Update the URL hash without causing navigation
      if (window.history && window.history.pushState) {
        window.history.pushState(null, null, `#${targetId}`);
      }
    }
  };

  return (
    <div ref={contentRef}>
      <section
        className="mg-table-of-contents"
        data-mg-table-of-contents
        data-mg-table-of-contents-title={title}
        ref={tocRef}
      >
        <ListComponent>
          {tocData.map((item, index) => (
            <li key={index}>
              <a
                href={`#${item.id}`}
                onClick={e => handleAnchorClick(e, item.id)}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ListComponent>
      </section>
    </div>
  );
}

TableOfContents.defaultParameters = {
  tocData: [],
  showNumbers: false,
  title: 'On this page',
};
