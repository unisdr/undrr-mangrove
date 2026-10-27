import noticeFromElement from '../Notice.fromElement';

describe('noticeFromElement', () => {
  function makeContainer(attrs = {}, innerHTML = '') {
    const el = document.createElement('div');
    el.setAttribute('data-mg-notice', '');
    Object.entries(attrs).forEach(([key, val]) => {
      el.setAttribute(`data-${key}`, val);
    });
    el.innerHTML = innerHTML;
    return el;
  }

  it('extracts scalar attributes', () => {
    const props = noticeFromElement(
      makeContainer({
        title: 'Maintenance',
        description: 'Tonight 02:00 UTC.',
        variant: 'warning',
        'heading-level': 'h2',
        'is-compact': 'true',
        'is-prominent': 'true',
        'is-dismissible': 'true',
        'dismiss-label': 'Close',
      })
    );

    expect(props).toMatchObject({
      title: 'Maintenance',
      description: 'Tonight 02:00 UTC.',
      variant: 'warning',
      headingLevel: 'h2',
      isCompact: true,
      isProminent: true,
      isOverlay: false,
      isDismissible: true,
      dismissLabel: 'Close',
    });
  });

  it('reads child content as plain text only', () => {
    const props = noticeFromElement(
      makeContainer(
        {},
        `<h3 class="mg-notice__title">Title</h3>
         <div class="mg-notice__description"><p>Body <img src=x onerror="alert(1)"></p></div>`
      )
    );

    expect(props.title).toBe('Title');
    expect(props.description).toBe('Body');
  });
});
