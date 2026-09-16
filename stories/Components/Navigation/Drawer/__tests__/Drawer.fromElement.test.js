import drawerFromElement from '../Drawer.fromElement';

describe('drawerFromElement', () => {
  function makeContainer(attrs = {}, innerHTML = '') {
    const el = document.createElement('div');
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(`data-${key}`, value);
    });
    if (innerHTML) {
      el.innerHTML = innerHTML;
    }
    return el;
  }

  it('returns default props when no data attributes or inner content are present', () => {
    const el = makeContainer();
    const props = drawerFromElement(el);

    expect(props).toEqual({
      isOpen: false,
      position: 'start',
      title: undefined,
      backdrop: true,
      isFloatingPanel: false,
      children: '',
      footer: undefined,
      className: undefined,
    });
  });

  it('extracts props from data attributes', () => {
    const el = makeContainer({
      'is-open': 'true',
      position: 'bottom',
      title: 'Filter Options',
      backdrop: 'false',
      'is-floating-panel': 'true',
      content: 'Custom content',
      footer: 'Footer note',
      'class-name': 'custom-drawer-class',
    });
    const props = drawerFromElement(el);

    expect(props.isOpen).toBe(true);
    expect(props.position).toBe('bottom');
    expect(props.title).toBe('Filter Options');
    expect(props.backdrop).toBe(false);
    expect(props.isFloatingPanel).toBe(true);
    expect(props.children).toBe('Custom content');
    expect(props.footer).toBe('Footer note');
    expect(props.className).toBe('custom-drawer-class');
  });

  it('extracts structured body, title, and footer from DOM elements', () => {
    const innerHTML = `
      <h2 class="mg-drawer__title">DOM Title</h2>
      <div class="mg-drawer__body"><p>Rendered paragraph</p></div>
      <div class="mg-drawer__footer"><button>Confirm</button></div>
    `;
    const el = makeContainer({ position: 'end' }, innerHTML);
    const props = drawerFromElement(el);

    expect(props.title).toBe('DOM Title');
    expect(props.children).toBe('<p>Rendered paragraph</p>');
    expect(props.footer).toBe('<button>Confirm</button>');
    expect(props.position).toBe('end');
  });

  it('detects is-open and mg-floating-panel classes on host element', () => {
    const el = document.createElement('div');
    el.className = 'mg-floating-panel is-open';
    const props = drawerFromElement(el);

    expect(props.isOpen).toBe(true);
    expect(props.isFloatingPanel).toBe(true);
  });
});
