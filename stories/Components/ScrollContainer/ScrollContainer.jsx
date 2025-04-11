import React, {
  useRef,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";

// Separate arrow buttons component
const ArrowButtons = React.memo(({ onScroll, showLeft, showRight }) => {
  const leftButtonRef = useRef(null);
  const rightButtonRef = useRef(null);

  // Update button classes without causing re-renders
  useEffect(() => {
    if (leftButtonRef.current) {
      leftButtonRef.current.classList.toggle(
        "mg-scroll__nav-button--disabled",
        !showLeft,
      );
    }
    if (rightButtonRef.current) {
      rightButtonRef.current.classList.toggle(
        "mg-scroll__nav-button--disabled",
        !showRight,
      );
    }
  }, [showLeft, showRight]);

  return (
    <nav className="mg-scroll__nav">
      <button
        ref={leftButtonRef}
        className="mg-scroll__nav-button"
        onClick={() => onScroll("left")}
        aria-label="Scroll left"
      >
        ←
      </button>
      <button
        ref={rightButtonRef}
        className="mg-scroll__nav-button"
        onClick={() => onScroll("right")}
        aria-label="Scroll right"
      >
        →
      </button>
    </nav>
  );
});

ArrowButtons.propTypes = {
  onScroll: PropTypes.func.isRequired,
  showLeft: PropTypes.bool.isRequired,
  showRight: PropTypes.bool.isRequired,
};

// Scroll container component
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
  const arrowVisibilityRef = useRef({ showLeft: false, showRight: false });
  const isMobileRef = useRef(false);
  const dragStateRef = useRef({
    isDragging: false,
    hasDragged: false,
    startX: 0,
    startScrollLeft: 0,
  });

  const dragThreshold = 10; // Minimum pixels to consider as a drag

  // Check if we're on a mobile device
  const checkMobileStatus = useCallback(() => {
    isMobileRef.current =
      "ontouchstart" in window &&
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  }, []);

  // Memoize scroll function
  const scroll = useCallback(
    (direction) => {
      if (!containerRef.current) return;

      // Calculate scroll amount based on container width or step size
      const scrollAmount = stepSize || containerRef.current.clientWidth / 2;
      const newScrollLeft =
        containerRef.current.scrollLeft +
        (direction === "right" ? scrollAmount : -scrollAmount);

      // Use smooth scrolling for better user experience
      containerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    },
    [stepSize],
  );

  // Update arrow visibility without causing re-renders
  const updateArrowVisibility = useCallback(() => {
    if (!containerRef.current || !showArrows || isMobileRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    const newShowLeft = scrollLeft > 0;
    const newShowRight = scrollLeft + clientWidth < scrollWidth;

    if (
      newShowLeft !== arrowVisibilityRef.current.showLeft ||
      newShowRight !== arrowVisibilityRef.current.showRight
    ) {
      arrowVisibilityRef.current = {
        showLeft: newShowLeft,
        showRight: newShowRight,
      };
      // Force a re-render only when arrow visibility changes
      forceUpdate();
    }
  }, [showArrows]);

  // Force update function for arrow visibility changes
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const handleDragStart = useCallback((e) => {
    if (
      !containerRef.current ||
      (e.type.includes("mouse") && isMobileRef.current)
    )
      return;

    // Only handle mouse events for desktop, regardless of viewport size
    // This allows drag to work on desktop browsers at small viewport sizes
    if (e.type.includes("mouse")) {
      dragStateRef.current = {
        ...dragStateRef.current,
        isDragging: true,
        hasDragged: false,
        startX: e.pageX,
        startScrollLeft: containerRef.current.scrollLeft,
      };
      e.preventDefault();
    }
  }, []);

  const handleDragMove = useCallback(
    (e) => {
      if (
        !dragStateRef.current.isDragging ||
        !containerRef.current ||
        (e.type.includes("mouse") && isMobileRef.current)
      )
        return;

      if (e.type.includes("mouse")) {
        const x = e.pageX;
        const distance = Math.abs(dragStateRef.current.startX - x);

        if (distance > dragThreshold) {
          e.preventDefault();
          dragStateRef.current.hasDragged = true;
          const walk = dragStateRef.current.startX - x;
          containerRef.current.scrollLeft =
            dragStateRef.current.startScrollLeft + walk;
          updateArrowVisibility();
        }
      }
    },
    [updateArrowVisibility],
  );

  const handleDragEnd = useCallback((e) => {
    if (dragStateRef.current.isDragging) {
      dragStateRef.current.isDragging = false;
    }

    const x = e.pageX;
    const distance = Math.abs(dragStateRef.current.startX - x);
    if (distance < 2 && e.target.href) {
      window.parent.location.href = e.target.href;
    }
  }, []);

  const handleClick = useCallback((e) => {
    if (dragStateRef.current.hasDragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // Memoize container styles
  const containerStyle = useMemo(
    () => ({
      "--scroll-height": height,
      "--scroll-min-width": minWidth,
      "--scroll-padding": padding,
      "--scroll-item-width": itemWidth,
    }),
    [height, minWidth, padding, itemWidth],
  );

  // Memoize container classes
  const containerClasses = useMemo(
    () =>
      [
        "mg-scroll__container",
        height && "mg-scroll__container--custom-height",
        minWidth && "mg-scroll__container--custom-width",
        padding && "mg-scroll__container--custom-padding",
        itemWidth && "mg-scroll__container--custom-item-width",
        isMobileRef.current && "mg-scroll__container--mobile",
        className,
      ]
        .filter(Boolean)
        .join(" "),
    [height, minWidth, padding, itemWidth, className],
  );

  useEffect(() => {
    // Initial check for mobile status
    checkMobileStatus();
    updateArrowVisibility();

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", updateArrowVisibility, {
        passive: true,
      });
      window.addEventListener("resize", updateArrowVisibility, {
        passive: true,
      });

      if (!isMobileRef.current) {
        container.addEventListener("mousedown", handleDragStart);
        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
        window.addEventListener("mouseleave", handleDragEnd);
      }

      container.addEventListener("click", handleClick, { capture: true });
    }

    return () => {
      if (container) {
        // Remove scroll event listeners
        container.removeEventListener("scroll", updateArrowVisibility);
        window.removeEventListener("resize", updateArrowVisibility);

        // Remove mouse drag event listeners
        if (!isMobileRef.current) {
          container.removeEventListener("mousedown", handleDragStart);
          window.removeEventListener("mousemove", handleDragMove);
          window.removeEventListener("mouseup", handleDragEnd);
          window.removeEventListener("mouseleave", handleDragEnd);
        }

        // Remove click handler
        container.removeEventListener("click", handleClick, { capture: true });
      }
    };
  }, [
    checkMobileStatus,
    updateArrowVisibility,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleClick,
  ]);

  return (
    // data-mg-scroll-container is not used directly in storybook, however it is useful documentation for other integrations, such as Gutenberg
    <section
      className={`mg-scroll${isMobileRef.current ? " mg-scroll--mobile" : ""}`}
      data-mg-scroll-container
    >
      {showArrows && !isMobileRef.current && (
        <ArrowButtons
          onScroll={scroll}
          showLeft={arrowVisibilityRef.current.showLeft}
          showRight={arrowVisibilityRef.current.showRight}
        />
      )}
      <div
        ref={containerRef}
        className={containerClasses}
        style={containerStyle}
        {...props}
      >
        <div
          ref={contentRef}
          className={`mg-scroll__content${isMobileRef.current ? "" : " mg-grid"}`}
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
  height: "auto",
  minWidth: "auto",
  itemWidth: "auto",
  padding: "0",
  className: "",
  showArrows: false,
  stepSize: null,
};

export default React.memo(ScrollContainer);
