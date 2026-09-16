import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const DEFAULT_ICONS = {
  info: 'mg-icon-info-circle',
  warning: 'mg-icon-exclamation-triangle',
  negative: 'mg-icon-close',
  emergency: 'mg-icon-close',
  error: 'mg-icon-close',
  positive: 'mg-icon-refresh', // or generic check indicator
  success: 'mg-icon-refresh',
};

export const Notice = ({
  title,
  description,
  children,
  variant = 'info',
  icon = true,
  isCompact = false,
  isProminent = false,
  isOverlay = false,
  isDismissible = false,
  onDismiss,
  dismissLabel = 'Dismiss notification',
  actions,
  headerContent,
  role,
  ariaLive,
  className,
  ...props
}) => {
  const effectiveRole =
    role ||
    (variant === 'negative' || variant === 'emergency' ? 'alert' : 'status');
  const effectiveAriaLive =
    ariaLive ||
    (variant === 'negative' || variant === 'emergency'
      ? 'assertive'
      : 'polite');

  const noticeClasses = classNames(
    'mg-notice',
    `mg-notice--${variant}`,
    {
      'mg-notice--compact': isCompact,
      'mg-notice--prominent': isProminent,
      'mg-notice--overlay': isOverlay,
    },
    className
  );

  let iconName = null;
  if (typeof icon === 'string') {
    iconName = icon;
  } else if (icon === true) {
    iconName = DEFAULT_ICONS[variant] || DEFAULT_ICONS.info;
  }

  const content =
    children ||
    (typeof description === 'string' ? (
      <div dangerouslySetInnerHTML={{ __html: description }} />
    ) : (
      description
    ));

  return (
    <div
      className={noticeClasses}
      role={effectiveRole}
      aria-live={effectiveAriaLive}
      {...props}
    >
      {(title || iconName || isDismissible || headerContent) && (
        <div className="mg-notice__header">
          {iconName && (
            <span
              className={classNames('mg-icon mg-notice__icon', iconName)}
              aria-hidden="true"
            />
          )}
          {title && <h3 className="mg-notice__title">{title}</h3>}
          {headerContent}
          {isDismissible && onDismiss && (
            <button
              type="button"
              className="mg-notice__dismiss"
              onClick={onDismiss}
              aria-label={dismissLabel}
            >
              <span className="mg-icon mg-icon-close" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {content && <div className="mg-notice__description">{content}</div>}

      {actions && <div className="mg-notice__actions">{actions}</div>}
    </div>
  );
};

Notice.propTypes = {
  /** Notice title / heading */
  title: PropTypes.node,
  /** Notice body content (string HTML or node) */
  description: PropTypes.node,
  /** Children as alternative to description */
  children: PropTypes.node,
  /** Severity variant */
  variant: PropTypes.oneOf([
    'info',
    'warning',
    'negative',
    'emergency',
    'error',
    'positive',
    'success',
  ]),
  /** Icon to display (true for default, false to disable, or specific mg-icon class name) */
  icon: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.node]),
  /** Compact padding and typography */
  isCompact: PropTypes.bool,
  /** Full-width prominent banner styling for top-level emergency messages */
  isProminent: PropTypes.bool,
  /** Centered absolute overlay for canvas / chart containers */
  isOverlay: PropTypes.bool,
  /** Whether the notice displays a close/dismiss button */
  isDismissible: PropTypes.bool,
  /** Callback fired when dismiss button is clicked */
  onDismiss: PropTypes.func,
  /** Accessible label for the dismiss button */
  dismissLabel: PropTypes.string,
  /** Action buttons / controls slot */
  actions: PropTypes.node,
  /** Custom content rendered inside the header row */
  headerContent: PropTypes.node,
  /** Accessible ARIA role override */
  role: PropTypes.string,
  /** ARIA live politeness level override */
  ariaLive: PropTypes.string,
  /** Additional CSS class names */
  className: PropTypes.string,
};

export default Notice;
