export const DEFAULT_COPY = {
  401: {
    title: 'You are not signed in',
    description:
      'This page requires you to be signed in. If you think you should have access, sign in and try again.',
  },
  403: {
    title: 'You do not have permission to view this page',
    description: 'Your account does not have access to this content.',
  },
  404: {
    title: 'We cannot find the page you are looking for',
    description:
      'If you entered a web address, check it is correct. If you followed a link, it may be incorrect. <br /> You can also <a href="/">view the homepage</a>, browse the <a href="https://www.undrr.org/undrr-directory">UNDRR directory</a>, or try searching:',
  },
  429: {
    title: 'Too many requests',
    description:
      'You have made too many requests in a short time. Wait a moment and try again.',
  },
  500: {
    title: 'Something went wrong on our side',
    description:
      'We could not complete your request. Try again in a few minutes. If the problem continues, contact us.',
    details:
      'Error code: 500 Service Unavailable\nRequest ID: abc123-example\nError URL: https://example.org/varnish-error/503',
  },
  502: {
    title: 'Bad gateway',
    description:
      'There was a temporary problem connecting to the service. Try again in a moment.',
  },
  503: {
    title: 'We are temporarily unavailable',
    description:
      'The site is temporarily unavailable due to maintenance or high load. Please try again later.',
    actionsHtml:
      'If this continues, please check the <a href="https://messaging.undrr.org/">UNDRR status page</a>.',
    details:
      'Error code: 503 Service Unavailable\nRequest ID: abc123-example\nError URL: https://example.org/varnish-error/503',
  },
  504: {
    title: 'Gateway timeout',
    description:
      'The service took too long to respond. Refresh the page or try again later.',
  },
};


