import React from 'react';
import { DEFAULT_COPY, CHALLENGE_COPY, EXAMPLE_REQUEST_DETAILS } from './ErrorPagesContent.js';

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
  variant = 'error',
  challengeType = 'challenge',
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
  const isChallenge = variant === 'challenge';
  const challengeDefaults = isChallenge
    ? CHALLENGE_COPY[challengeType] || CHALLENGE_COPY.challenge
    : null;
  const defaults = isChallenge ? {} : (DEFAULT_COPY[code] || DEFAULT_COPY[404]);

  const resolvedTitle = title || (isChallenge ? challengeDefaults.title : defaults.title);
  const resolvedDescription = description || (isChallenge ? challengeDefaults.description : defaults.description);
  const resolvedPrimary = primaryAction || defaults.primary;
  const resolvedSecondary = secondaryAction || defaults.secondary;

  const mainClass = ['mg-error-page', isChallenge && 'mg-error-page--challenge']
    .filter(Boolean)
    .join(' ');

  return (
    <main className={mainClass} {...props}>
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
        {!showBrandHeader && !isChallenge && (
          <p className="mg-error-page__code" aria-hidden="true">
            {code}
          </p>
        )}

          {isChallenge && (
            <a href="https://www.undrr.org/">
              <div className="undrr-logo" aria-hidden="true" />
            </a>
          )}
          {isChallenge
            ? <h1>{resolvedDescription}</h1>
            : <><h1>{`Error ${code}`}</h1><h2>{resolvedTitle}</h2></>
          }
          {isChallenge && challengeDefaults?.body && (
            <p>{challengeDefaults.body}</p>
          )}
          {!isChallenge && (typeof resolvedDescription === 'string' ? (
            <p dangerouslySetInnerHTML={{ __html: resolvedDescription }} />
          ) : (
            <p>{resolvedDescription}</p>
          ))}
          {isChallenge && (
            <div
              style={{
                border: '2px dashed #b3b3b3',
                borderRadius: '8px',
                padding: '2.5rem 2rem',
                margin: '2rem auto',
                maxWidth: '400px',
                textAlign: 'center',
                color: '#666',
              }}
            >
              <code>::CAPTCHA_BOX::</code>
              <br />
              <small>Cloudflare challenge widget appears here</small>
            </div>
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
            {isChallenge
              ? <>Having trouble? <a href={contactUrl}>Contact us</a>{showRequestDetails ? ' and include the details below' : ''}.
              </>
              : <>If you think this is in error or need help, <a href={contactUrl}>please contact us</a> and provide the details below.</>}
          </p>

          {showRequestDetails && requestDetails && (
            <p className="mg-code" role="note" aria-label="Request details">
              {!isChallenge && <>Error code: {code} | </>}Ray ID: {requestDetails.rayId} | Your IP: {requestDetails.clientIp} | Location: {requestDetails.geo}
            </p>
          )}
          {!isChallenge && (
            <>
              <hr />
              <small>This website is operated by</small>
              <a href="https://www.undrr.org/">
                <div className="undrr-logo" aria-hidden="true" />
              </a>
            </>
          )}
        </div>
    </main>
  );
}

export default ErrorPage;
