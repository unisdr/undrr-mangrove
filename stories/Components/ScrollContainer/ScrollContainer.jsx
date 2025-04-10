import React, { useRef, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const ScrollContainer = ({
  children,
  height,
  minWidth,
  itemWidth,
  padding,
  className,
  showArrows,
  stepSize,
  ...props
}) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startScrollLeft, setStartScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
  const dragThreshold = 10; // Minimum pixels to consider as a drag

  // Check if we're on a mobile device
  const checkMobileStatus = useCallback(() => {
    // Only check for actual touch devices, not just small viewports
    // This allows mouse drag to work on desktop browsers at small sizes
    const isMobileDevice = 'ontouchstart' in window && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
  }, []);

  const checkArrowVisibility = useCallback(() => {
    if (!containerRef.current || !showArrows || isMobile) return;

    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
  }, [showArrows, isMobile]);

  // Scroll buttons
  const scroll = useCallback((direction) => {
    if (!containerRef.current) return;

    // Calculate scroll amount based on container width or step size
    const scrollAmount = stepSize || containerRef.current.clientWidth / 2;
    const newScrollLeft = containerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);

    // Use smooth scrolling for better user experience
    containerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  }, [stepSize]);

  const handleDragStart = useCallback((e) => {
    if (!containerRef.current) return;

    // Only handle mouse events for desktop, regardless of viewport size
    // This allows drag to work on desktop browsers at small viewport sizes
    if (e.type.includes('mouse')) {
      // On mobile devices, don't interfere with native scrolling
      if (isMobile) return;

      setIsDragging(true);
      setHasDragged(false);
      setStartX(e.pageX);
      setStartScrollLeft(containerRef.current.scrollLeft);
      e.preventDefault();
    }
  }, [isMobile]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;

    // Only handle mouse events for desktop drag behavior
    if (e.type.includes('mouse')) {
      // On mobile devices, don't interfere with native scrolling
      if (isMobile) return;

      const x = e.pageX;
      const distance = Math.abs(startX - x);

      // Set hasDragged if we exceed the threshold
      if (distance > dragThreshold) {
        e.preventDefault();
        setHasDragged(true);
        const walk = (startX - x);
        containerRef.current.scrollLeft = startScrollLeft + walk;
      }

      checkArrowVisibility();
    }
  }, [isDragging, startX, startScrollLeft, checkArrowVisibility, dragThreshold, isMobile]);

  const handleDragEnd = useCallback((e) => {
    // Only handle if we're in dragging state (desktop only)

    if (isDragging) {
      setIsDragging(false);
    }

    // If the user hasn't scrolled, open the link
    const x = e.pageX;
    const distance = Math.abs(startX - x);
    if (distance < 2) {
      if (e.target.href) {
        console.log('opening',e.target.href);
        window.parent.location.href = e.target.href;
      }
    }
  }, [isDragging]);

  const handleClick = useCallback((e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [hasDragged]);

  useEffect(() => {
    // Initial check for mobile status
    checkMobileStatus();
    checkArrowVisibility();

    const container = containerRef.current;
    if (container) {
      // Scroll event listeners
      container.addEventListener('scroll', checkArrowVisibility);
      window.addEventListener('resize', () => {
        checkMobileStatus();
        checkArrowVisibility();
      });

      // Only add mouse event listeners (for desktop drag behavior)
      // Touch events will use native scrolling
      container.addEventListener('mousedown', handleDragStart);
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('mouseleave', handleDragEnd);

      // Add click handler to prevent click after drag
      container.addEventListener('click', handleClick, { capture: true });
    }

    return () => {
      if (container) {
        // Remove scroll event listeners
        container.removeEventListener('scroll', checkArrowVisibility);
        window.removeEventListener('resize', checkArrowVisibility);

        // Remove mouse drag event listeners
        container.removeEventListener('mousedown', handleDragStart);
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('mouseleave', handleDragEnd);

        // Remove click handler
        container.removeEventListener('click', handleClick, { capture: true });
      }
    };
  }, [checkArrowVisibility, handleDragStart, handleDragMove, handleDragEnd, handleClick, checkMobileStatus]);

  const containerStyle = {
    '--scroll-height': height,
    '--scroll-min-width': minWidth,
    '--scroll-padding': padding,
    '--scroll-item-width': itemWidth,
  };

  const containerClasses = [
    'mg-scroll__container',
    height && 'mg-scroll__container--custom-height',
    minWidth && 'mg-scroll__container--custom-width',
    padding && 'mg-scroll__container--custom-padding',
    itemWidth && 'mg-scroll__container--custom-item-width',
    isMobile && 'mg-scroll__container--mobile',
    className
  ].filter(Boolean).join(' ');

  return (
    // data-mg-scroll-container is not used directly in storybook, however it is useful documentation for other integrations, such as Gutenberg
    <section className={`mg-scroll${isMobile ? ' mg-scroll--mobile' : ''}`} data-mg-scroll-container>
      {showArrows && !isMobile && (
        <nav className="mg-scroll__nav">
          <button
            className="mg-scroll__nav-button"
            onClick={() => scroll('left')}
            disabled={!showLeftArrow}
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            className="mg-scroll__nav-button"
            onClick={() => scroll('right')}
            disabled={!showRightArrow}
            aria-label="Scroll right"
          >
            →
          </button>
        </nav>
      )}
      <div
        ref={containerRef}
        className={containerClasses}
        style={containerStyle}
        onScroll={checkArrowVisibility}
        {...props}
      >
        <div
          ref={contentRef}
          className={`mg-scroll__content${isMobile ? "" : " mg-grid"}`}
        >
          {/* {React.Children.map(children, (child) => (
            <div className="mg-scroll__item-wrapper">{child}</div>
          ))} */}

          {/* In some environments (like Gutenberg), it is a set of individual html blobs */}
          {Array.isArray(children) && !React.isValidElement(children[0])
            ? children.map((child, index) => {
                // console.log("HTML blob");
                // console.log("Child type:", typeof child);
                // console.log("Is valid element:", React.isValidElement(child));
                // console.log("Child value:", child);
                return (
                  <div key={index} className="mg-scroll__item-wrapper">
                    <div dangerouslySetInnerHTML={{ __html: String(child) }} />
                  </div>
                );
              })
            : React.Children.map(children, (child) => {
                // console.log("Real react");
                // console.log("Child type:", typeof child);
                // console.log("Is valid element:", React.isValidElement(child));
                // console.log("Child value:", child);
                return <div className="mg-scroll__item-wrapper">{child}</div>;
              })}
        </div>
      </div>
    </section>
  );
};

ScrollContainer.propTypes = {
  children: PropTypes.node.isRequired,
  height: PropTypes.string,
  minWidth: PropTypes.string,
  itemWidth: PropTypes.string,
  padding: PropTypes.string,
  className: PropTypes.string,
  showArrows: PropTypes.bool,
  stepSize: PropTypes.number,
};
ScrollContainer.defaultProps = {
  height: 'auto',
  minWidth: 'auto',
  itemWidth: 'auto',
  padding: '0',
  className: '',
  showArrows: false,
  stepSize: null,
};

export default ScrollContainer;
