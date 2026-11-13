import { getLanguageProps } from '../../../src/i18n';
import { getGalleryLabels } from './_labels';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Loader } from '../../Utilities/Loader/Loader';

export { getGalleryLabels } from './_labels';
export { DEFAULT_GALLERY_LABELS } from './_labels';

// Bubbling event dispatched from the gallery root when the visible item changes.
const GALLERY_CHANGE_EVENT = 'mg-gallery:change';
// Styles imported via stories/assets/scss/_components.scss to maintain Sass cascade

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

// Everything a browser can put in the focus order inside an injected preview.
const THUMBNAIL_PREVIEW_FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'iframe',
  'object',
  'embed',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]',
  '[tabindex]',
].join(',');

function GalleryComponent({
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
  lang,
  dir,
  labels,
  analyticsRegion = 'gallery',
}) {
  const { galleryAriaLabel, prevLabel, nextLabel, loadingLabel } =
    getGalleryLabels(lang, labels);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(false);
  const galleryRef = useRef(null);
  const mainImageRef = useRef(null);
  const thumbnailContainerRef = useRef(null);
  const thumbnailRefs = useRef([]);
  const thumbnailPreviewRefs = useRef([]);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const pendingChange = useRef(null);

  const activeItem = media[activeIndex];

  // Set loading state when switching to video/embed
  useEffect(() => {
    if (activeItem.type === 'video' || activeItem.type === 'embed') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [activeIndex, activeItem.type]);

  // An `html` thumbnail renders author markup that can contain links, buttons
  // or form controls. It sits inside `<button role="tab">`, so those would be
  // nested interactive content and focusable children of an aria-hidden node
  // (axe `nested-interactive`, `aria-hidden-focus`). `inert` on the preview
  // takes the whole subtree out of focus order, hit testing and the
  // accessibility tree; the `tabindex="-1"` sweep covers engines and tools
  // that do not implement `inert` yet. The tab button itself stays operable.
  useEffect(() => {
    thumbnailPreviewRefs.current.forEach(node => {
      if (!node) return;
      node.setAttribute('inert', '');
      node
        .querySelectorAll(THUMBNAIL_PREVIEW_FOCUSABLE_SELECTOR)
        .forEach(child => child.setAttribute('tabindex', '-1'));
    });
  }, [media]);

  // One `mg-gallery:change` for each change a visitor makes, sent after the
  // new item is on screen. The handlers record how the change was made; the
  // initial render records nothing, so it sends nothing. The detail carries
  // position and method only, never a caption, title or address.
  useEffect(() => {
    const change = pendingChange.current;
    const target = galleryRef.current;
    pendingChange.current = null;
    if (!change || !target) return;
    const EventClass =
      target.ownerDocument?.defaultView?.CustomEvent || CustomEvent;
    // The region the click tracker reports for the arrows and thumbnails.
    const region =
      target.closest('[data-vf-google-analytics-region]')?.dataset
        .vfGoogleAnalyticsRegion ?? '';
    target.dispatchEvent(
      new EventClass(GALLERY_CHANGE_EVENT, {
        bubbles: true,
        composed: true,
        detail: { region, ...change },
      })
    );
  }, [activeIndex]);

  // Show an item. `method` is how the visitor asked for it: `click` (an
  // arrow button), `thumbnail`, `swipe` or `key`.
  const goTo = useCallback(
    (index, method) => {
      if (index !== activeIndex) {
        pendingChange.current = { index, count: media.length, method };
      }
      setActiveIndex(index);
      if (onMediaChange) {
        onMediaChange(index, media[index]);
      }

      // Read the preference at navigation time, from the thumbnail's window.
      const thumbnail = thumbnailRefs.current[index];
      if (thumbnail) {
        const reducedMotion = thumbnail.ownerDocument.defaultView.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;
        thumbnail.scrollIntoView({
          // `auto` can inherit a consumer's smooth-scroll CSS.
          behavior: reducedMotion ? 'instant' : 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    },
    [activeIndex, media, onMediaChange]
  );

  // Navigate to next item
  const handleNext = useCallback(
    method => {
      if (activeIndex < media.length - 1) {
        goTo(activeIndex + 1, method);
      } else if (loop) {
        goTo(0, method);
      }
    },
    [activeIndex, media.length, goTo, loop]
  );

  // Navigate to previous item
  const handlePrevious = useCallback(
    method => {
      if (activeIndex > 0) {
        goTo(activeIndex - 1, method);
      } else if (loop) {
        goTo(media.length - 1, method);
      }
    },
    [activeIndex, goTo, loop, media.length]
  );

  // Keyboard navigation (scoped to gallery when focused)
  const handleKeyDown = useCallback(
    e => {
      if (!enableKeyboard) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious('key');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext('key');
          break;
        case 'Home':
          e.preventDefault();
          goTo(0, 'key');
          break;
        case 'End':
          e.preventDefault();
          goTo(media.length - 1, 'key');
          break;
        default:
          break;
      }
    },
    [enableKeyboard, handleNext, handlePrevious, goTo, media.length]
  );

  // Touch/swipe handlers for mobile
  const handleTouchStart = e => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = e => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left, go to next image
        handleNext('swipe');
      } else {
        // Swiped right, go to previous image
        handlePrevious('swipe');
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
      {...getLanguageProps(lang, dir)}
      ref={galleryRef}
      className={galleryClasses}
      role="region"
      aria-label={galleryAriaLabel}
      data-vf-google-analytics-region={analyticsRegion || undefined}
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
              aria-describedby={
                showDescription && activeItem.description
                  ? 'gallery-description'
                  : undefined
              }
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
              aria-describedby={
                showDescription && activeItem.description
                  ? 'gallery-description'
                  : undefined
              }
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
              aria-describedby={
                showDescription && activeItem.description
                  ? 'gallery-description'
                  : undefined
              }
            />
          )}
          {activeItem.type === 'html' && (
            <div
              ref={mainImageRef}
              className="mg-gallery__image mg-gallery__html"
              dangerouslySetInnerHTML={{ __html: activeItem.html }}
              aria-describedby={
                showDescription && activeItem.description
                  ? 'gallery-description'
                  : undefined
              }
            />
          )}
          {isLoading && (
            <div className="mg-gallery__loading">
              <Loader size="inline" label={loadingLabel} />
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {showArrows && arrowStyle === 'overlay' && (
          <>
            <button
              className="mg-gallery__arrow mg-gallery__arrow--prev"
              onClick={() => handlePrevious('click')}
              disabled={!loop && activeIndex === 0}
              aria-label={prevLabel}
              data-vf-analytics-label="Gallery: Previous"
              type="button"
            >
              ‹
            </button>
            <button
              className="mg-gallery__arrow mg-gallery__arrow--next"
              onClick={() => handleNext('click')}
              disabled={!loop && activeIndex === media.length - 1}
              aria-label={nextLabel}
              data-vf-analytics-label="Gallery: Next"
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
              onClick={() => handlePrevious('click')}
              disabled={!loop && activeIndex === 0}
              aria-label={prevLabel}
              data-vf-analytics-label="Gallery: Previous"
              type="button"
            >
              ‹
            </button>
            <button
              className="mg-gallery__arrow-button mg-gallery__arrow-button--next"
              onClick={() => handleNext('click')}
              disabled={!loop && activeIndex === media.length - 1}
              aria-label={nextLabel}
              data-vf-analytics-label="Gallery: Next"
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
          {activeItem.title && (
            <div className="mg-gallery__title">{activeItem.title}</div>
          )}
          {activeItem.description && (
            <p className="mg-gallery__caption">{activeItem.description}</p>
          )}
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
              ref={el => {
                thumbnailRefs.current[index] = el;
              }}
              className={cls(
                'mg-gallery__thumbnail',
                index === activeIndex && 'mg-gallery__thumbnail--active',
                item.type === 'html' &&
                  !item.thumbnail &&
                  'mg-gallery__thumbnail--html'
              )}
              onClick={() => goTo(index, 'thumbnail')}
              role="tab"
              aria-selected={index === activeIndex}
              aria-current={index === activeIndex ? 'true' : undefined}
              aria-label={`View ${item.title || item.alt || 'content'}`}
              data-vf-analytics-label="Gallery: Thumbnail"
              type="button"
            >
              {item.type === 'html' && !item.thumbnail && item.html ? (
                <div
                  ref={el => {
                    thumbnailPreviewRefs.current[index] = el;
                  }}
                  className="mg-gallery__thumbnail-html-preview"
                  aria-hidden="true"
                  inert
                >
                  <div
                    className="mg-gallery__thumbnail-html-content"
                    dangerouslySetInnerHTML={{ __html: item.html }}
                  />
                </div>
              ) : item.thumbnail || item.src ? (
                <img src={item.thumbnail || item.src} alt="" loading="lazy" />
              ) : (
                <span
                  className="mg-gallery__thumbnail-placeholder"
                  aria-hidden="true"
                >
                  ◫
                </span>
              )}
              {(item.type === 'video' || item.type === 'embed') && (
                <span
                  className="mg-gallery__thumbnail-indicator"
                  aria-hidden="true"
                >
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

GalleryComponent.propTypes = {
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
  /** UI language tag; selects the built-in catalogue, with English fallback. */
  lang: PropTypes.string,
  /** Explicit text direction; otherwise known catalogue languages select their direction. */
  dir: PropTypes.oneOf(['ltr', 'rtl', 'auto']),
  /** Explicit UI label overrides; omitted keys use the selected catalogue, then English. */
  labels: PropTypes.shape({
    galleryAriaLabel: PropTypes.string,
    prevLabel: PropTypes.string,
    nextLabel: PropTypes.string,
    loadingLabel: PropTypes.string,
  }),
  /** `data-vf-google-analytics-region` on the root; pass an empty string to omit it. */
  analyticsRegion: PropTypes.string,
};

export const Gallery = React.memo(GalleryComponent);
