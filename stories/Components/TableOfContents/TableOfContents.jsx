import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { mgTableOfContents } from './js/TableOfContentsVanillaJs';

/**
 * Renders an in-page table of contents with smooth-scroll anchor links.
 *
 * @param {Object} props
 * @param {Array<{id: string, text: string}>} props.tocData Array of heading entries to list
 * @param {boolean} [props.showNumbers]  Whether to render an ordered list instead of unordered
 * @param {string} [props.title]         Heading text displayed above the list
 */
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

TableOfContents.propTypes = {
  /** Array of heading entries, each with an id and display text */
  tocData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
  /** Whether to render an ordered list instead of unordered */
  showNumbers: PropTypes.bool,
  /** Heading text displayed above the list */
  title: PropTypes.string,
};
