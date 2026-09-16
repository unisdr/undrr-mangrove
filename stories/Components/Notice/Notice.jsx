import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const NOTICE_VARIANTS = ['info', 'warning', 'negative', 'positive'];

// The icon font has no check or error-circle glyph: negative shares the
// triangle with warning (colour, border and text carry the difference) and
// positive uses an inline SVG.
const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M16.59 7.58 10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
  </svg>
);

const DEFAULT_ICONS = {
  info: 'mg-icon-info-circle',
  warning: 'mg-icon-exclamation-triangle',
  negative: 'mg-icon-exclamation-triangle',
  positive: <CheckCircleIcon />,
};

const HEADING_LEVELS = ['h2', 'h3', 'h4', 'h5', 'h6'];

export const Notice = ({
  title,
  description,
  children,
  variant = 'info',
  icon = true,
  headingLevel = 'h3',
  isCompact = false,
  isProminent = false,
  isOverlay = false,
  isDismissible = false,
  onDismiss,
  dismissLabel = 'Dismiss notification',
  actions,
  headerContent,
  role,
  className,
  ...props
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const safeVariant = NOTICE_VARIANTS.includes(variant) ? variant : 'info';
  // role="alert" and role="status" imply assertive and polite live regions;
  // adding aria-live on top makes some screen readers announce twice.
  // Pass role={null} for a static notice that should not be a live region.
  const effectiveRole =
    role === undefined
      ? safeVariant === 'negative'
        ? 'alert'
        : 'status'
      : role || undefined;
  const HeadingTag = HEADING_LEVELS.includes(headingLevel)
    ? headingLevel
    : 'h3';

  const noticeClasses = classNames(
    'mg-notice',
    `mg-notice--${safeVariant}`,
    {
      'mg-notice--compact': isCompact,
      'mg-notice--prominent': isProminent,
      'mg-notice--overlay': isOverlay,
    },
    className
  );

  let iconName = null;
  if (icon === true) {
    iconName = DEFAULT_ICONS[safeVariant];
  } else if (icon) {
    iconName = icon;
  }

  // Strings render as text, never as HTML, so CMS or API supplied copy
  // cannot inject markup. Pass React nodes for rich content.
  const content = children || description;

  const handleDismiss = event => {
    setIsDismissed(true);
    if (onDismiss) onDismiss(event);
  };

  return (
    <div className={noticeClasses} role={effectiveRole} {...props}>
      {(title || iconName || isDismissible || headerContent) && (
        <div className="mg-notice__header">
          {typeof iconName === 'string' && (
            <span
              className={classNames('mg-icon mg-notice__icon', iconName)}
              aria-hidden="true"
            />
          )}
          {iconName && typeof iconName !== 'string' && (
            <span className="mg-notice__icon" aria-hidden="true">
              {iconName}
            </span>
          )}
          {title && (
            <HeadingTag className="mg-notice__title">{title}</HeadingTag>
          )}
          {headerContent}
          {isDismissible && (
            <button
              type="button"
              className="mg-icon-button mg-icon-button--small mg-notice__dismiss"
              onClick={handleDismiss}
              aria-label={dismissLabel}
            >
              <span className="mg-icon mg-icon-close" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {content && (
        <div className="mg-notice__description">
          {typeof content === 'string' ? <p>{content}</p> : content}
        </div>
      )}

      {actions && (
        <div className="mg-notice__actions mg-buttons">{actions}</div>
      )}
    </div>
  );
};

Notice.propTypes = {
  /** Notice title / heading */
  title: PropTypes.node,
  /** Notice body. Strings render as plain text; pass nodes for rich content. */
  description: PropTypes.node,
  /** Children as alternative to description */
  children: PropTypes.node,
  /** Severity variant. For emergency banners combine `negative` with `isProminent`. */
  variant: PropTypes.oneOf(NOTICE_VARIANTS),
  /** true for the variant default, false to hide, an mg-icon class name, or an SVG node */
  icon: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.node]),
  /** Heading element for the title, to fit the surrounding document outline */
  headingLevel: PropTypes.oneOf(HEADING_LEVELS),
  /** Compact padding and typography */
  isCompact: PropTypes.bool,
  /** Full-width prominent banner styling for top-level emergency messages */
  isProminent: PropTypes.bool,
  /** Centered absolute overlay for canvas / chart containers */
  isOverlay: PropTypes.bool,
  /** Shows a dismiss button; the notice hides itself when it is pressed */
  isDismissible: PropTypes.bool,
  /** Optional callback fired after the notice is dismissed */
  onDismiss: PropTypes.func,
  /** Accessible label for the dismiss button */
  dismissLabel: PropTypes.string,
  /** Action buttons / controls slot */
  actions: PropTypes.node,
  /** Custom content rendered inside the header row */
  headerContent: PropTypes.node,
  /** ARIA role override. Defaults to alert for negative, status otherwise; null for none. */
  role: PropTypes.string,
  /** Additional CSS class names */
  className: PropTypes.string,
};

export default Notice;
