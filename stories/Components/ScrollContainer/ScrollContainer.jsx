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
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(null);

  const checkArrowVisibility = () => {
    if (!containerRef.current || !showArrows) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
  };

  const scroll = useCallback((direction) => {
    if (!containerRef.current) return;

    const scrollAmount = stepSize || containerRef.current.clientWidth;
    const newScrollLeft = containerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
    
    containerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  }, [stepSize]);

  const handleDragStart = (e) => {
    if (!containerRef.current) return;

    setIsDragging(true);
    setStartX(e.type.includes('mouse') ? e.pageX : e.touches[0].pageX);
    setDragDistance(0);
    setDragStartTime(Date.now());

    if (e.type.includes('mouse')) {
      e.preventDefault();
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || !containerRef.current) return;

    // Get final direction and trigger step
    const direction = dragDistance > 0 ? 'left' : 'right';
    scroll(direction);

    setIsDragging(false);
    setDragDistance(0);
  };

  const handleDragMove = (e) => {
    if (!isDragging || !containerRef.current) return;

    const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    const distance = startX - currentX;

    // Only trigger if it's a real drag (both time and distance thresholds)
    const dragDuration = Date.now() - dragStartTime;
    if (Math.abs(distance) > 20 && dragDuration > 100) { // Must drag at least 20px and for 100ms
      setDragDistance(distance);
      scroll(distance > 0 ? 'right' : 'left');
      setIsDragging(false);
      setDragStartTime(null);
    }

    if (e.type.includes('mouse')) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    checkArrowVisibility();
    const container = containerRef.current;
    if (container) {
      // Scroll event listeners
      container.addEventListener('scroll', checkArrowVisibility);
      window.addEventListener('resize', checkArrowVisibility);

      // Mouse drag event listeners
      container.addEventListener('mousedown', handleDragStart);
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('mouseleave', handleDragEnd);

      // Touch event listeners
      container.addEventListener('touchstart', handleDragStart, { passive: true });
      container.addEventListener('touchmove', handleDragMove, { passive: true });
      container.addEventListener('touchend', handleDragEnd);
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
      }
    };
  }, [showArrows, handleDragStart, handleDragMove, handleDragEnd]);
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
