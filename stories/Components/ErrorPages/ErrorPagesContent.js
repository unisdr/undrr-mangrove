export const DEFAULT_COPY = {
  401: {
    title: 'You are not signed in',
    description:
      'You need to sign in to view this page. If you think you should have access, sign in and try again.',
  },
  403: {
    title: 'You do not have permission to view this page',
    description: 'You don\'t have permission to view this page. If you need access, contact the website team.',
  },
  404: {
    title: 'We can\'t find the page you\'re looking for',
    description:
      'If you typed the web address, check that it\'s correct. If you followed a link, it may be out of date. <br /> Go to the <a href="/">homepage</a>, browse the <a href="https://www.undrr.org/undrr-directory">UNDRR directory</a>, or search:',
  },
  429: {
    title: 'Too many requests',
    description:
      'You made too many requests in a short time. Wait a moment, then try again.',
  },
  500: {
    title: 'Something went wrong on our side',
    description:
      'We couldn\'t complete your request. Try again in a few minutes. If the problem continues, contact us.',
    details:
      'Error code: 500 Service Unavailable\nRequest ID: abc123-example\nError URL: https://example.org/varnish-error/503',
  },
  502: {
    title: 'Bad gateway',
    description:
      'There was a temporary problem connecting to the service. Try again in a moment.',
  },
  503: {
    title: 'Service temporarily unavailable',
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


