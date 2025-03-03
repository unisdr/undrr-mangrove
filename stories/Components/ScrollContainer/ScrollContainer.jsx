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
  
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startScrollLeft, setStartScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
  const dragThreshold = 5; // Minimum pixels to consider as a drag

  const checkArrowVisibility = useCallback(() => {
    if (!containerRef.current || !showArrows) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
  }, [showArrows]);

  const scroll = useCallback((direction) => {
    if (!containerRef.current) return;

    const scrollAmount = stepSize || containerRef.current.clientWidth / 2;
    const newScrollLeft = containerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
    
    containerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  }, [stepSize]);

  const handleDragStart = useCallback((e) => {
    if (!containerRef.current) return;
    
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.type.includes('mouse') ? e.pageX : e.touches[0].pageX);
    setStartScrollLeft(containerRef.current.scrollLeft);
    
    if (e.type.includes('mouse')) {
      e.preventDefault();
    }
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;

    e.preventDefault();
    const x = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    const distance = Math.abs(startX - x);
    
    // Set hasDragged if we exceed the threshold
    if (distance > dragThreshold) {
      setHasDragged(true);
    }
    
    const walk = (startX - x) * 1.5; // Multiply by 1.5 for faster scrolling
    containerRef.current.scrollLeft = startScrollLeft + walk;
    checkArrowVisibility();
  }, [isDragging, startX, startScrollLeft, checkArrowVisibility, dragThreshold]);

  const handleDragEnd = useCallback((e) => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback((e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [hasDragged]);

  useEffect(() => {
    checkArrowVisibility();
    const container = containerRef.current;
    if (container) {
      // Scroll event listeners
      container.addEventListener('scroll', checkArrowVisibility);
      window.addEventListener('resize', checkArrowVisibility);

      container.addEventListener('mousedown', handleDragStart);
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('mouseleave', handleDragEnd);

      container.addEventListener('touchstart', handleDragStart, { passive: true });
      container.addEventListener('touchmove', handleDragMove, { passive: false });
      container.addEventListener('touchend', handleDragEnd);
      
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

        // Remove touch event listeners
        container.removeEventListener('touchstart', handleDragStart);
        container.removeEventListener('touchmove', handleDragMove);
        container.removeEventListener('touchend', handleDragEnd);
        
        // Remove click handler
        container.removeEventListener('click', handleClick, { capture: true });
      }
    };
  }, [checkArrowVisibility, handleDragStart, handleDragMove, handleDragEnd, handleClick]);
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
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="mg-scroll">
      {showArrows && (
        <div className="mg-scroll__nav">
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
        </div>
      )}
      <div
        ref={containerRef}
        className={containerClasses}
        style={containerStyle}
        onScroll={checkArrowVisibility}
        {...props}
      >
        <div ref={contentRef}
          className={`mg-scroll__content mg-grid`}
        >
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
