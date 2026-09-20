import scrollContainerFromElement from '../ScrollContainer.fromElement';

function createContainer(attrs = {}, innerHTML = '') {
  const el = document.createElement('div');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(`data-${key}`, value);
  });
  el.innerHTML = innerHTML;
  return el;
}

describe('scrollContainerFromElement', () => {
  it('extracts all data attributes with correct types', () => {
    const container = createContainer({
      height: '300px',
      'min-width': '200px',
      'item-width': '250px',
      padding: '16',
      'show-arrows': 'true',
      'aria-label': 'Related publications',
      'stretch-items': 'true',
      'step-size': '300',
    });
    const props = scrollContainerFromElement(container);

    expect(props.height).toBe('300px');
    expect(props.minWidth).toBe('200px');
    expect(props.itemWidth).toBe('250px');
    expect(props.padding).toBe('16');
    expect(props.showArrows).toBe(true);
    expect(props.ariaLabel).toBe('Related publications');
    expect(props.stretchItems).toBe(true);
    expect(props.stepSize).toBe(300);
  });

  it('returns defaults when no data attributes set', () => {
    const container = createContainer();
    const props = scrollContainerFromElement(container);

    expect(props.height).toBe('auto');
    expect(props.minWidth).toBe('auto');
    expect(props.itemWidth).toBe('auto');
    expect(props.padding).toBe('0');
    expect(props.showArrows).toBe(false);
    expect(props.ariaLabel).toBe('Scrollable content');
    expect(props.stretchItems).toBe(false);
    expect(props.stepSize).toBeNull();
  });

  it('coerces showArrows string to boolean', () => {
    const trueContainer = createContainer({ 'show-arrows': 'true' });
    expect(scrollContainerFromElement(trueContainer).showArrows).toBe(true);

    const falseContainer = createContainer({ 'show-arrows': 'false' });
    expect(scrollContainerFromElement(falseContainer).showArrows).toBe(false);

    const emptyContainer = createContainer({ 'show-arrows': '' });
    expect(scrollContainerFromElement(emptyContainer).showArrows).toBe(false);
  });

  it('parses stepSize as integer, null when missing', () => {
    const withStep = createContainer({ 'step-size': '450' });
    expect(scrollContainerFromElement(withStep).stepSize).toBe(450);

    const withoutStep = createContainer();
    expect(scrollContainerFromElement(withoutStep).stepSize).toBeNull();
  });

  it('extracts children from .mg-scroll__content as HTML strings', () => {
    const html = `
      <div class="mg-scroll__content">
        <div class="card">Card 1</div>
        <div class="card">Card 2</div>
        <div class="card">Card 3</div>
      </div>
    `;
    const container = createContainer({}, html);
    const props = scrollContainerFromElement(container);

    expect(props.children).toHaveLength(3);
    expect(props.children[0]).toContain('Card 1');
    expect(props.children[1]).toContain('Card 2');
    expect(props.children[2]).toContain('Card 3');
  });

  it('falls back to full innerHTML when no content wrapper', () => {
    const html = '<p>Some content</p>';
    const container = createContainer({}, html);
    const props = scrollContainerFromElement(container);

    expect(props.children).toHaveLength(1);
    expect(props.children[0]).toBe('<p>Some content</p>');
  });

  it('reads each container on a page with two of them', () => {
    document.body.innerHTML = `
      <div id="first" data-mg-scroll-container>
        <div class="mg-scroll__content">
          <div class="card">First A</div>
          <div class="card">First B</div>
        </div>
      </div>
      <div id="second" data-mg-scroll-container>
        <div class="mg-scroll__content">
          <div class="card">Second A</div>
        </div>
      </div>
    `;

    const first = scrollContainerFromElement(
      document.getElementById('first')
    ).children;
    const second = scrollContainerFromElement(
      document.getElementById('second')
    ).children;

    expect(first).toHaveLength(2);
    expect(first[0]).toContain('First A');
    expect(first[1]).toContain('First B');
    expect(second).toHaveLength(1);
    expect(second[0]).toContain('Second A');
    expect(second.join('')).not.toContain('First');

    document.body.innerHTML = '';
  });

  it('ignores a content wrapper that belongs to a nested scroll container', () => {
    const html = `
      <p>Outer content</p>
      <div data-mg-scroll-container>
        <div class="mg-scroll__content">
          <div class="card">Nested card</div>
        </div>
      </div>
    `;
    const container = createContainer({}, html);
    const props = scrollContainerFromElement(container);

    // The outer container has no wrapper of its own, so it keeps all of its
    // markup rather than adopting the nested container's cards.
    expect(props.children).toHaveLength(1);
    expect(props.children[0]).toContain('Outer content');
    expect(props.children[0]).toContain('Nested card');
  });

  it('prefers its own wrapper over a nested one', () => {
    const html = `
      <div class="mg-scroll__content">
        <div class="card">Own card</div>
      </div>
      <div data-mg-scroll-container>
        <div class="mg-scroll__content">
          <div class="card">Nested card</div>
        </div>
      </div>
    `;
    const container = createContainer({}, html);
    const props = scrollContainerFromElement(container);

    expect(props.children).toHaveLength(1);
    expect(props.children[0]).toContain('Own card');
  });

  it('prefers a direct-child wrapper over a deeper one earlier in the markup', () => {
    // Document order puts the deeper wrapper first, so only the direct-child
    // preference picks the container's own wrapper here.
    const html = `
      <section class="promo">
        <div class="mg-scroll__content">
          <div class="card">Deep card</div>
        </div>
      </section>
      <div class="mg-scroll__content">
        <div class="card">Own card</div>
      </div>
    `;
    const container = createContainer({}, html);
    const props = scrollContainerFromElement(container);

    expect(props.children).toHaveLength(1);
    expect(props.children[0]).toContain('Own card');
    expect(props.children[0]).not.toContain('Deep card');
  });

  it('returns empty children for empty container', () => {
    const container = createContainer();
    const props = scrollContainerFromElement(container);

    expect(props.children).toEqual([]);
  });

  it('returns empty children for whitespace-only container', () => {
    const container = createContainer({}, '   \n  ');
    const props = scrollContainerFromElement(container);

    expect(props.children).toEqual([]);
  });
});
