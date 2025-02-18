import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './scroll-container.scss';

const ScrollContainer = ({
  children,
  height,
  minWidth,
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

  const checkArrowVisibility = () => {
    if (!containerRef.current || !showArrows) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
  };

  const scroll = (direction) => {
    if (!containerRef.current) return;

    const scrollAmount = stepSize || containerRef.current.clientWidth;
    const newScrollLeft = containerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
    
    containerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    checkArrowVisibility();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkArrowVisibility);
      window.addEventListener('resize', checkArrowVisibility);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkArrowVisibility);
        window.removeEventListener('resize', checkArrowVisibility);
      }
    };
  }, [showArrows]);
  const containerStyle = {
    '--scroll-height': height,
    '--scroll-min-width': minWidth,
    '--scroll-padding': padding
  };

  const containerClasses = [
    'scroll-container',
    height && 'custom-height',
    minWidth && 'custom-min-width',
    padding && 'custom-padding',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="scroll-container-wrapper">
      {showArrows && (
        <div className="scroll-arrows">
          <button 
            className="scroll-arrow"
            onClick={() => scroll('left')}
            disabled={!showLeftArrow}
            aria-label="Scroll left"
          >
            ←
          </button>
          <button 
            className="scroll-arrow"
            onClick={() => scroll('right')}
            disabled={!showRightArrow}
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className={containerClasses}
        style={containerStyle}
        onScroll={checkArrowVisibility}
        {...props}
      >
        <div ref={contentRef} className="scroll-content">
          {children}
        </div>
      </div>
    </div>
  );
};

ScrollContainer.propTypes = {
  children: PropTypes.node.isRequired,
  height: PropTypes.string,
  minWidth: PropTypes.string,
  padding: PropTypes.string,
  className: PropTypes.string,
  showArrows: PropTypes.bool,
  stepSize: PropTypes.number,
};

ScrollContainer.defaultProps = {
  height: 'auto',
  minWidth: 'auto',
  padding: '0',
  className: '',
  showArrows: false,
  stepSize: null,
};

export default ScrollContainer;
