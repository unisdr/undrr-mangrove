import React from 'react';
import { DEFAULT_COPY } from './ErrorPagesContent.js';

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
  actionsHtml,
  actionsContent,
  details,
  ...props
}) {
  const defaults = DEFAULT_COPY[code] || DEFAULT_COPY[404];

  const resolvedTitle = title || defaults.title;
  const resolvedDescription = description || defaults.description;
  const resolvedPrimary = primaryAction || defaults.primary;
  const resolvedSecondary = secondaryAction || defaults.secondary;
  const resolvedActionsHtml = actionsHtml ?? defaults.actionsHtml;
  const resolvedDetails = details ?? defaults.details;

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
          {(resolvedActionsHtml || actionsContent) && (
            <div className="mg-error-page__actions">
              {resolvedActionsHtml && (
                <div dangerouslySetInnerHTML={{ __html: resolvedActionsHtml }} />
              )}
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

          {resolvedDetails && (
            <pre role="note" aria-label="error details"><code className="mg-code--block">{resolvedDetails}</code></pre>
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
            If you think this is in error or need help, <a href={contactUrl}>please contact us</a> and provide a link to the page.
          </p>
          <hr />
          <small>This website is operated by</small>
          <a href="https://www.undrr.org/">
            <div className="undrr-logo" aria-hidden="true" />
          </a>
        </div>
        <script type="text/javascript" src="https://assets.undrr.org/static/analytics/v1.0.0/google_analytics_enhancements.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
        <script src="https://messaging.undrr.org/src/undrr-messaging.js" defer></script>
    </main>
  );
}

export default ErrorPage;
