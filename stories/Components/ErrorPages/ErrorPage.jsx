import React from 'react';
import { DEFAULT_COPY, EXAMPLE_REQUEST_DETAILS } from './ErrorPagesContent.js';

function renderAction(action) {
  if (!action) return null;
  const { label, href, action: onClick } = action;
  const commonProps = {
    className: 'mg-button mg-button-primary',
  };
  if (onClick && !href) {
    return (
      <button type="button" onClick={onClick} {...commonProps}>
        {label}
      </button>
    );
  }
  return (
    <a href={href} className={commonProps.className}>
      {label}
    </a>
  );
}

/**
 * ErrorPage component: standardized UX for common HTTP error states.
 * - Uses sentence case headings and calm, actionable guidance per writing standards
 * - Provides sensible default copy for common error codes
 * - Allows override of title, description, and actions
 * - Supports showing request details (Ray ID, IP, location) for debugging
 *
 * For Cloudflare integration, static HTML templates are available in the
 * static/ directory with Cloudflare tokens pre-configured.
 */
export function ErrorPage({
  code = 404,
  title,
  description,
  primaryAction,
  secondaryAction,
  showSearch = false,
  searchAction = '/search',
  contactUrl = 'https://www.undrr.org/contact-us',
  showBrandHeader = true,
  showButtons = false,
  showRequestDetails = false,
  requestDetails = EXAMPLE_REQUEST_DETAILS,
  actionsContent,
  ...props
}) {
  const defaults = DEFAULT_COPY[code] || DEFAULT_COPY[404];

  const resolvedTitle = title || defaults.title;
  const resolvedDescription = description || defaults.description;
  const resolvedPrimary = primaryAction || defaults.primary;
  const resolvedSecondary = secondaryAction || defaults.secondary;
  return (
    <main className="mg-error-page" {...props}>
      {showBrandHeader && (
        <>
          <div className="mg-page-header__decoration" aria-hidden="true">
            <div />
            <div />
            <div />
            <div />
          </div>
        </>
      )}
      <div className="mg-error-page__container mg-container--spacer">
        {!showBrandHeader && (
          <p className="mg-error-page__code" aria-hidden="true">
            {code}
          </p>
        )}

          <h1>{`Error ${code}`}</h1>
          <h2>{resolvedTitle}</h2>
          {typeof resolvedDescription === 'string' ? (
            <p dangerouslySetInnerHTML={{ __html: resolvedDescription }} />
          ) : (
            <p>{resolvedDescription}</p>
          )}
          {actionsContent && (
            <div className="mg-error-page__actions">
              {actionsContent}
            </div>
          )}
          {showButtons && (
            <div className="mg-error-page__actions">
              {resolvedPrimary && renderAction(resolvedPrimary)}
              {resolvedSecondary && (
                <a
                  className="mg-button mg-button-secondary"
                  href={resolvedSecondary.href}
                >
                  {resolvedSecondary.label}
                </a>
              )}
            </div>
          )}

          {showSearch && (
            <form
              className="mg-error-page__search"
              action={searchAction}
              role="search"
            >
              <label className="mg-u-sr-only" htmlFor="error-search">
                Search
              </label>
              <input
                id="error-search"
                name="q"
                type="search"
                placeholder="Search"
              />
              <button type="submit" className="mg-button mg-button-primary">
                Search
              </button>
            </form>
          )}

          <p>
            If you think this is in error or need help, <a href={contactUrl}>please contact us</a> and provide the details below.
          </p>

          {showRequestDetails && requestDetails && (
            <p className="mg-code" role="note" aria-label="Request details">
              Error code: {code} | Ray ID: {requestDetails.rayId} | Your IP: {requestDetails.clientIp} | Location: {requestDetails.geo}
            </p>
          )}
          <hr />
          <small>This website is operated by</small>
          <a href="https://www.undrr.org/">
            <div className="undrr-logo" aria-hidden="true" />
          </a>
        </div>
    </main>
  );
}

export default ErrorPage;
