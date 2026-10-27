import serviceNoticeFromElement, {
  RETRY_EVENT,
} from '../ServiceNotice.fromElement';

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
      'status-url': 'https://messaging.undrr.org/',
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
    expect(props.statusUrl).toBe('https://messaging.undrr.org/');
    expect(props.statusUrlLabel).toBe('Check status');
    expect(props.countdownSeconds).toBe(15);
    expect(props.isCompact).toBe(true);
    expect(props.isOverlay).toBe(true);
    expect(props.onRetry).toBeUndefined();
  });

  it('reads the compact and overlay class fallbacks, then removes them from the container', () => {
    const el = makeContainer({ status: 'offline' });
    el.className = 'map-embed mg-notice--compact mg-notice--overlay';

    const props = serviceNoticeFromElement(el);

    expect(props.isCompact).toBe(true);
    expect(props.isOverlay).toBe(true);
    // Left in place, the container would be styled as a second notice.
    expect(el.classList.contains('mg-notice--compact')).toBe(false);
    expect(el.classList.contains('mg-notice--overlay')).toBe(false);
    expect(el.classList.contains('map-embed')).toBe(true);
  });

  it('leaves the container classes alone when data-is-* is used', () => {
    const el = makeContainer({ 'is-compact': 'true', 'is-overlay': 'false' });
    el.className = 'map-embed';

    const props = serviceNoticeFromElement(el);

    expect(props.isCompact).toBe(true);
    expect(props.isOverlay).toBe(false);
    expect(el.className).toBe('map-embed');
  });

  it('dispatches a bubbling retry event when data-retry is present', () => {
    const el = makeContainer({ retry: '', 'max-auto-retries': '2' });
    const parent = document.createElement('div');
    parent.appendChild(el);
    const listener = jest.fn();
    parent.addEventListener(RETRY_EVENT, listener);

    const props = serviceNoticeFromElement(el);
    props.onRetry();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(props.maxAutoRetries).toBe(2);
  });

  it('does not re-inject child markup as HTML', () => {
    const el = makeContainer(
      {},
      '<div class="mg-notice__description"><img src=x onerror="alert(1)">Down</div>'
    );
    expect(serviceNoticeFromElement(el).description).toBe('Down');
  });

  it('extracts title and description from child DOM elements when data attributes are absent', () => {
    const el = makeContainer(
      {},
      `
      <div class="mg-notice__header">
        <h3 class="mg-notice__title">Embedded Map Service</h3>
      </div>
      <div class="mg-notice__description">
        <p>Map tiles cannot be loaded.</p>
      </div>
    `
    );

    const props = serviceNoticeFromElement(el);

    expect(props.title).toBe('Embedded Map Service');
    expect(props.description).toBe('Map tiles cannot be loaded.');
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
