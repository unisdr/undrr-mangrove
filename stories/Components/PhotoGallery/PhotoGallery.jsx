import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
// Styles imported via stories/assets/scss/_components.scss to maintain Sass cascade

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

function PhotoGalleryComponent({
  media,
  initialIndex = 0,
  showThumbnails = true,
  thumbnailPosition = 'left',
  showArrows = true,
  arrowStyle = 'overlay',
  showDescription = true,
  enableKeyboard = true,
  loop = false,
  onMediaChange,
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(false);
  const galleryRef = useRef(null);
  const mainImageRef = useRef(null);
  const thumbnailContainerRef = useRef(null);
  const thumbnailRefs = useRef([]);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const activeItem = media[activeIndex];

  // Set loading state when switching to video/embed
  useEffect(() => {
    if (activeItem.type === 'video' || activeItem.type === 'embed') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [activeIndex, activeItem.type]);

  // Handle thumbnail click
  const handleThumbnailClick = useCallback(
    (index) => {
      setActiveIndex(index);
      if (onMediaChange) {
        onMediaChange(index, media[index]);
      }

      // Scroll thumbnail into view
      if (thumbnailRefs.current[index]) {
        thumbnailRefs.current[index].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    },
    [media, onMediaChange]
  );

  // Navigate to next item
  const handleNext = useCallback(() => {
    if (activeIndex < media.length - 1) {
      handleThumbnailClick(activeIndex + 1);
    } else if (loop) {
      handleThumbnailClick(0);
    }
  }, [activeIndex, media.length, handleThumbnailClick, loop]);

  // Navigate to previous item
  const handlePrevious = useCallback(() => {
    if (activeIndex > 0) {
      handleThumbnailClick(activeIndex - 1);
    } else if (loop) {
      handleThumbnailClick(media.length - 1);
    }
  }, [activeIndex, handleThumbnailClick, loop, media.length]);

  // Keyboard navigation (scoped to gallery when focused)
  const handleKeyDown = useCallback(
    (e) => {
      if (!enableKeyboard) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'Home':
          e.preventDefault();
          handleThumbnailClick(0);
          break;
        case 'End':
          e.preventDefault();
          handleThumbnailClick(media.length - 1);
          break;
        default:
          break;
      }
    },
    [enableKeyboard, handleNext, handlePrevious, handleThumbnailClick, media.length]
  );

  // Touch/swipe handlers for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left, go to next image
        handleNext();
      } else {
        // Swiped right, go to previous image
        handlePrevious();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const galleryClasses = cls(
    'mg-gallery',
    thumbnailPosition === 'bottom' && 'mg-gallery--thumbnails-bottom'
  );

  return (
    <div
      ref={galleryRef}
      className={galleryClasses}
      role="region"
      aria-label="Photo gallery"
      tabIndex={enableKeyboard ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Main image display */}
      <div className="mg-gallery__main" role="group">
        <div
          className="mg-gallery__image-wrapper"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {(!activeItem.type || activeItem.type === 'image') && (
            <img
              ref={mainImageRef}
              src={activeItem.src}
              alt={activeItem.alt}
              className="mg-gallery__image"
              aria-describedby={showDescription && activeItem.description ? 'gallery-description' : undefined}
            />
          )}
          {activeItem.type === 'video' && (
            <video
              ref={mainImageRef}
              src={activeItem.src}
              className="mg-gallery__image mg-gallery__video"
              controls
              poster={activeItem.poster}
              onLoadedData={() => setIsLoading(false)}
              onLoadStart={() => setIsLoading(true)}
              aria-describedby={showDescription && activeItem.description ? 'gallery-description' : undefined}
            >
              <track kind="captions" />
              Your browser does not support the video tag.
            </video>
          )}
          {activeItem.type === 'embed' && (
            <iframe
              ref={mainImageRef}
              src={activeItem.embedUrl || activeItem.src}
              className="mg-gallery__image mg-gallery__embed"
              title={activeItem.title || activeItem.alt}
              allowFullScreen
              onLoad={() => setIsLoading(false)}
              aria-describedby={showDescription && activeItem.description ? 'gallery-description' : undefined}
            />
          )}
          {activeItem.type === 'html' && (
            <div
              ref={mainImageRef}
              className="mg-gallery__image mg-gallery__html"
              dangerouslySetInnerHTML={{ __html: activeItem.html }}
              aria-describedby={showDescription && activeItem.description ? 'gallery-description' : undefined}
            />
          )}
          {isLoading && (
            <div className="mg-gallery__loading" aria-live="polite" aria-label="Loading media">
              <div className="mg-gallery__spinner"></div>
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {showArrows && arrowStyle === 'overlay' && (
          <>
            <button
              className="mg-gallery__arrow mg-gallery__arrow--prev"
              onClick={handlePrevious}
              disabled={!loop && activeIndex === 0}
              aria-label="Previous item"
              type="button"
            >
              ‹
            </button>
            <button
              className="mg-gallery__arrow mg-gallery__arrow--next"
              onClick={handleNext}
              disabled={!loop && activeIndex === media.length - 1}
              aria-label="Next item"
              type="button"
            >
              ›
            </button>
          </>
        )}
        {showArrows && arrowStyle === 'corner' && (
          <div className="mg-gallery__arrow-controls">
            <button
              className="mg-gallery__arrow-button mg-gallery__arrow-button--prev"
              onClick={handlePrevious}
              disabled={!loop && activeIndex === 0}
              aria-label="Previous item"
              type="button"
            >
              ‹
            </button>
            <button
              className="mg-gallery__arrow-button mg-gallery__arrow-button--next"
              onClick={handleNext}
              disabled={!loop && activeIndex === media.length - 1}
              aria-label="Next item"
              type="button"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Description area */}
      {showDescription && (activeItem.title || activeItem.description) && (
        <div className="mg-gallery__description" id="gallery-description">
          {activeItem.title && <div className="mg-gallery__title">{activeItem.title}</div>}
          {activeItem.description && <p className="mg-gallery__caption">{activeItem.description}</p>}
        </div>
      )}

      {/* Thumbnails */}
      {showThumbnails && (
        <div
          ref={thumbnailContainerRef}
          className="mg-gallery__thumbnails"
          role="tablist"
          aria-label="Gallery thumbnails"
        >
          {media.map((item, index) => (
            <button
              key={item.id}
              ref={(el) => (thumbnailRefs.current[index] = el)}
              className={cls(
                'mg-gallery__thumbnail',
                index === activeIndex && 'mg-gallery__thumbnail--active',
                item.type === 'html' && !item.thumbnail && 'mg-gallery__thumbnail--html'
              )}
              onClick={() => handleThumbnailClick(index)}
              role="tab"
              aria-selected={index === activeIndex}
              aria-current={index === activeIndex ? 'true' : undefined}
              aria-label={`View ${item.title || item.alt || 'content'}`}
              type="button"
            >
              {item.type === 'html' && !item.thumbnail && item.html ? (
                <div className="mg-gallery__thumbnail-html-preview" aria-hidden="true">
                  <div
                    className="mg-gallery__thumbnail-html-content"
                    dangerouslySetInnerHTML={{ __html: item.html }}
                  />
                </div>
              ) : (item.thumbnail || item.src) ? (
                <img src={item.thumbnail || item.src} alt="" loading="lazy" />
              ) : (
                <span className="mg-gallery__thumbnail-placeholder" aria-hidden="true">
                  ◫
                </span>
              )}
              {(item.type === 'video' || item.type === 'embed') && (
                <span className="mg-gallery__thumbnail-indicator" aria-hidden="true">
                  ▶
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

PhotoGalleryComponent.propTypes = {
  /** Array of media items (images, videos, embeds, or html) */
  media: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['image', 'video', 'embed', 'html']),
      src: PropTypes.string,
      alt: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      thumbnail: PropTypes.string,
      poster: PropTypes.string,
      embedUrl: PropTypes.string,
      /** Raw HTML content for type='html' */
      html: PropTypes.string,
    })
  ).isRequired,
  /** Index of the initially displayed item */
  initialIndex: PropTypes.number,
  /** Show/hide thumbnail list */
  showThumbnails: PropTypes.bool,
  /** Position of thumbnails: 'left' or 'bottom' */
  thumbnailPosition: PropTypes.oneOf(['left', 'bottom']),
  /** Show/hide navigation arrows */
  showArrows: PropTypes.bool,
  /** Arrow style: 'overlay' or 'corner' */
  arrowStyle: PropTypes.oneOf(['overlay', 'corner']),
  /** Show/hide item titles and captions */
  showDescription: PropTypes.bool,
  /** Enable/disable keyboard navigation */
  enableKeyboard: PropTypes.bool,
  /** Enable infinite loop navigation */
  loop: PropTypes.bool,
  /** Callback when media item changes: (index, item) => {} */
  onMediaChange: PropTypes.func,
};

export const PhotoGallery = React.memo(PhotoGalleryComponent);
