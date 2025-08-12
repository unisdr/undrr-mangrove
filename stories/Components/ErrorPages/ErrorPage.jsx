import React from 'react';

const DEFAULT_COPY = {
  401: {
    title: 'You are not signed in',
    description:
      'This page requires you to be signed in. If you think you should have access, sign in and try again.',
    primary: { label: 'Go to home', href: '/' },
    secondary: {
      label: 'Contact support',
      href: 'https://www.undrr.org/contact-us',
    },
  },
  403: {
    title: 'You do not have permission to view this page',
    description:
      'Your account does not have access to this content.',
    primary: { label: 'Go to home', href: '/' },
    secondary: {
      label: 'Contact support',
      href: 'https://www.undrr.org/contact-us',
    },
  },
  404: {
    title: 'We cannot find that page',
    description:
      'The page may have moved or no longer exists. Check the URL or use search to find what you need.',
    primary: { label: 'Go to home', href: '/' },
    secondary: { label: 'Browse directory', href: 'https://www.undrr.org/undrr-directory' },
  },
  429: {
    title: 'Too many requests',
    description:
      'You have made too many requests in a short time. Wait a moment and try again.',
    primary: {
      label: 'Try again',
      href: '',
      action: () => window.location.reload(),
    },
    secondary: { label: 'Go to home', href: '/' },
  },
  500: {
    title: 'Something went wrong on our side',
    description:
      'We could not complete your request. Try again in a few minutes. If the problem continues, contact us.',
    primary: {
      label: 'Try again',
      href: '',
      action: () => window.location.reload(),
    },
    secondary: {
      label: 'Contact support',
      href: 'https://www.undrr.org/contact-us',
    },
  },
  502: {
    title: 'Bad gateway',
    description:
      'There was a temporary problem connecting to the service. Try again in a moment.',
    primary: {
      label: 'Try again',
      href: '',
      action: () => window.location.reload(),
    },
    secondary: { label: 'Go to home', href: '/' },
  },
  503: {
    title: 'Service unavailable',
    description:
      'The site is temporarily unavailable due to maintenance or high load. Please try again later.',
    primary: {
      label: 'Try again',
      href: '',
      action: () => window.location.reload(),
    },
    secondary: { label: 'Status page', href: '/status' },
  },
  504: {
    title: 'Gateway timeout',
    description:
      'The service took too long to respond. Refresh the page or try again later.',
    primary: {
      label: 'Try again',
      href: '',
      action: () => window.location.reload(),
    },
    secondary: { label: 'Go to home', href: '/' },
  },
};

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
          <p>{resolvedDescription}</p>
          {(actionsHtml || actionsContent) && (
            <div className="mg-error-page__actions">
              {actionsHtml && (
                <div dangerouslySetInnerHTML={{ __html: actionsHtml }} />
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

          {details && (
            <pre role="note" aria-label="error details"><code className="mg-code--block">{details}</code></pre>
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
    </main>
  );
}

export default ErrorPage;
