import serviceNoticeFromElement from '../ServiceNotice.fromElement';

describe('serviceNoticeFromElement', () => {
  function makeContainer(attrs = {}, innerHTML = '') {
    const el = document.createElement('aside');
    el.setAttribute('data-mg-service-notice', '');
    Object.entries(attrs).forEach(([key, val]) => {
      el.setAttribute(`data-${key}`, val);
    });
    el.innerHTML = innerHTML;
    return el;
  }

  it('extracts scalar attributes', () => {
    const el = makeContainer({
      title: 'API Unavailable',
      description: 'The server responded with an error.',
      status: 'offline',
      'retry-label': 'Reconnect now',
      'status-url': 'https://status.undrr.org',
      'status-url-label': 'Check status',
      'countdown-seconds': '15',
      'is-compact': 'true',
      'is-overlay': 'true',
    });

    const props = serviceNoticeFromElement(el);

    expect(props.title).toBe('API Unavailable');
    expect(props.description).toBe('The server responded with an error.');
    expect(props.status).toBe('offline');
    expect(props.retryLabel).toBe('Reconnect now');
    expect(props.statusUrl).toBe('https://status.undrr.org');
    expect(props.statusUrlLabel).toBe('Check status');
    expect(props.countdownSeconds).toBe(15);
    expect(props.isCompact).toBe(true);
    expect(props.isOverlay).toBe(true);
  });

  it('extracts title and description from child DOM elements when data attributes are absent', () => {
    const el = makeContainer(
      {},
      `
      <div class="mg-service-notice__header">
        <h3 class="mg-service-notice__title">Embedded Map Service</h3>
      </div>
      <div class="mg-service-notice__description">
        <p>Map tiles cannot be loaded.</p>
      </div>
    `
    );

    const props = serviceNoticeFromElement(el);

    expect(props.title).toBe('Embedded Map Service');
    expect(props.description).toBe('<p>Map tiles cannot be loaded.</p>');
    expect(props.status).toBe('degraded');
  });

  it('parses data-labels JSON attribute', () => {
    const el = makeContainer({
      labels: JSON.stringify({
        statusOffline: 'Fuera de servicio',
        retryLabel: 'Reintentar',
      }),
    });

    const props = serviceNoticeFromElement(el);
    expect(props.labels.statusOffline).toBe('Fuera de servicio');
    expect(props.labels.retryLabel).toBe('Reintentar');
  });
});
