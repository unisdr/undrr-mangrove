import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
// import './photo-gallery.scss';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function PhotoGallery({
  images,
  initialIndex = 0,
  showThumbnails = true,
  thumbnailPosition = 'left',
  showArrows = true,
  arrowStyle = 'overlay',
  showDescription = true,
  enableKeyboard = true,
  loop = false,
  onImageChange,
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(false);
  const mainImageRef = useRef(null);
  const thumbnailContainerRef = useRef(null);
  const thumbnailRefs = useRef([]);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const activeImage = images[activeIndex];

  // Set loading state when switching to video/embed
  useEffect(() => {
    if (activeImage.type === 'video' || activeImage.type === 'embed') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [activeIndex, activeImage.type]);

  // Handle thumbnail click
  const handleThumbnailClick = useCallback(
    (index) => {
      setActiveIndex(index);
      if (onImageChange) {
        onImageChange(index, images[index]);
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
    [images, onImageChange]
  );

  // Navigate to next image
  const handleNext = useCallback(() => {
    if (activeIndex < images.length - 1) {
      handleThumbnailClick(activeIndex + 1);
    } else if (loop) {
      handleThumbnailClick(0);
    }
  }, [activeIndex, images.length, handleThumbnailClick, loop]);

  // Navigate to previous image
  const handlePrevious = useCallback(() => {
    if (activeIndex > 0) {
      handleThumbnailClick(activeIndex - 1);
    } else if (loop) {
      handleThumbnailClick(images.length - 1);
    }
  }, [activeIndex, handleThumbnailClick, loop, images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e) => {
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
          handleThumbnailClick(images.length - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, handleNext, handlePrevious, handleThumbnailClick, images.length]);

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
    <div className={galleryClasses} role="region" aria-label="Photo gallery">
      {/* Main image display */}
      <div className="mg-gallery__main" role="group">
        <div
          className="mg-gallery__image-wrapper"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {(!activeImage.type || activeImage.type === 'image') && (
            <img
              ref={mainImageRef}
              src={activeImage.src}
              alt={activeImage.alt}
              className="mg-gallery__image"
              aria-describedby={showDescription && activeImage.description ? 'gallery-description' : undefined}
            />
          )}
          {activeImage.type === 'video' && (
            <video
              ref={mainImageRef}
              src={activeImage.src}
              className="mg-gallery__image mg-gallery__video"
              controls
              poster={activeImage.poster}
              onLoadedData={() => setIsLoading(false)}
              onLoadStart={() => setIsLoading(true)}
              aria-describedby={showDescription && activeImage.description ? 'gallery-description' : undefined}
            >
              <track kind="captions" />
              Your browser does not support the video tag.
            </video>
          )}
          {activeImage.type === 'embed' && (
            <iframe
              ref={mainImageRef}
              src={activeImage.embedUrl || activeImage.src}
              className="mg-gallery__image mg-gallery__embed"
              title={activeImage.title || activeImage.alt}
              allowFullScreen
              onLoad={() => setIsLoading(false)}
              aria-describedby={showDescription && activeImage.description ? 'gallery-description' : undefined}
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
              aria-label="Previous image"
              type="button"
            >
              ‹
            </button>
            <button
              className="mg-gallery__arrow mg-gallery__arrow--next"
              onClick={handleNext}
              disabled={!loop && activeIndex === images.length - 1}
              aria-label="Next image"
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
              aria-label="Previous image"
              type="button"
            >
              ‹
            </button>
            <button
              className="mg-gallery__arrow-button mg-gallery__arrow-button--next"
              onClick={handleNext}
              disabled={!loop && activeIndex === images.length - 1}
              aria-label="Next image"
              type="button"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Description area */}
      {showDescription && (activeImage.title || activeImage.description) && (
        <div className="mg-gallery__description" id="gallery-description">
          {activeImage.title && <div className="mg-gallery__title">{activeImage.title}</div>}
          {activeImage.description && <p className="mg-gallery__caption">{activeImage.description}</p>}
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
          {images.map((image, index) => (
            <button
              key={image.id}
              ref={(el) => (thumbnailRefs.current[index] = el)}
              className={cls(
                'mg-gallery__thumbnail',
                index === activeIndex && 'mg-gallery__thumbnail--active'
              )}
              onClick={() => handleThumbnailClick(index)}
              role="tab"
              aria-selected={index === activeIndex}
              aria-current={index === activeIndex ? 'true' : undefined}
              aria-label={`View ${image.title || image.alt}`}
              type="button"
            >
              <img src={image.thumbnail || image.src} alt="" loading="lazy" />
              {(image.type === 'video' || image.type === 'embed') && (
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

PhotoGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['image', 'video', 'embed']),
      src: PropTypes.string.isRequired,
      alt: PropTypes.string.isRequired,
      title: PropTypes.string,
      description: PropTypes.string,
      thumbnail: PropTypes.string,
      poster: PropTypes.string,
      embedUrl: PropTypes.string,
    })
  ).isRequired,
  initialIndex: PropTypes.number,
  showThumbnails: PropTypes.bool,
  thumbnailPosition: PropTypes.oneOf(['left', 'bottom']),
  showArrows: PropTypes.bool,
  arrowStyle: PropTypes.oneOf(['overlay', 'corner']),
  showDescription: PropTypes.bool,
  enableKeyboard: PropTypes.bool,
  loop: PropTypes.bool,
  onImageChange: PropTypes.func,
};
