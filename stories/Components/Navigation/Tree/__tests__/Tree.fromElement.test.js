import treeFromElement from '../Tree.fromElement';

describe('treeFromElement', () => {
  function makeContainer(attrs = {}, innerHTML = '') {
    const el = document.createElement('div');
    el.setAttribute('data-mg-tree', '');
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(`data-${key}`, value);
    });
    el.innerHTML = innerHTML;
    return el;
  }

  it('returns defaults when the container is empty', () => {
    expect(treeFromElement(makeContainer())).toEqual({
      items: [],
      defaultExpandedIds: [],
      defaultSelectedId: null,
      guides: true,
      toggleIcon: undefined,
      'aria-label': undefined,
      'aria-labelledby': undefined,
      className: undefined,
    });
  });

  it('reads container attributes', () => {
    const props = treeFromElement(
      makeContainer({
        'aria-label': 'Section navigation',
        'aria-labelledby': 'nav-heading',
        'toggle-icon': 'mg-icon-arrow-right',
        guides: 'false',
        'class-name': 'custom-tree',
        'selected-id': 'b',
      })
    );
    expect(props['aria-label']).toBe('Section navigation');
    expect(props['aria-labelledby']).toBe('nav-heading');
    expect(props.toggleIcon).toBe('mg-icon-arrow-right');
    expect(props.guides).toBe(false);
    expect(props.className).toBe('custom-tree');
    expect(props.defaultSelectedId).toBe('b');
  });

  it('parses a nested list into items with labels, links and ids', () => {
    const props = treeFromElement(
      makeContainer(
        {},
        `<ul>
          <li data-id="about">
            <a href="/about">About   us</a>
            <ul>
              <li data-id="team"><a href="/about/team">Team</a></li>
              <li>History</li>
            </ul>
          </li>
          <li id="archive">Archive</li>
        </ul>`
      )
    );

    expect(props.items).toEqual([
      {
        id: 'about',
        label: 'About us',
        href: '/about',
        children: [
          { id: 'team', label: 'Team', href: '/about/team' },
          { id: '1-2', label: 'History' },
        ],
      },
      { id: 'archive', label: 'Archive' },
    ]);
  });

  it('excludes nested list text from a parent label', () => {
    const props = treeFromElement(
      makeContainer({}, '<ul><li>Parent<ul><li>Child</li></ul></li></ul>')
    );
    expect(props.items[0].label).toBe('Parent');
    expect(props.items[0].children[0].label).toBe('Child');
  });

  it('reads expanded state only for items with children', () => {
    const props = treeFromElement(
      makeContainer(
        {},
        `<ul>
          <li data-id="a" data-expanded><span>A</span><ul><li>A1</li></ul></li>
          <li data-id="b" aria-expanded="true">B<ul><li>B1</li></ul></li>
          <li data-id="c" data-expanded="false">C<ul><li>C1</li></ul></li>
          <li data-id="d" data-expanded>D</li>
        </ul>`
      )
    );
    expect(props.defaultExpandedIds).toEqual(['a', 'b']);
  });

  it('selects the first data-selected or aria-current item', () => {
    const props = treeFromElement(
      makeContainer(
        { 'selected-id': 'fallback' },
        `<ul>
          <li data-id="a">A<ul>
            <li data-id="a1"><a href="/a1" aria-current="page">A1</a></li>
          </ul></li>
          <li data-id="b" data-selected>B</li>
        </ul>`
      )
    );
    expect(props.defaultSelectedId).toBe('a1');
    expect(props.defaultExpandedIds).toEqual(['a']);
  });

  it('expands every ancestor of the selected item', () => {
    const props = treeFromElement(
      makeContainer(
        {},
        `<ul>
          <li data-id="a" data-expanded>A<ul>
            <li data-id="b">B<ul>
              <li data-id="c" data-selected>C</li>
            </ul></li>
          </ul></li>
        </ul>`
      )
    );
    expect(props.defaultSelectedId).toBe('c');
    expect(props.defaultExpandedIds).toEqual(['a', 'b']);
  });

  it('expands the ancestors of a data-selected-id fallback', () => {
    const props = treeFromElement(
      makeContainer(
        { 'selected-id': 'b1' },
        '<ul><li data-id="b">B<ul><li data-id="b1">B1</li></ul></li></ul>'
      )
    );
    expect(props.defaultExpandedIds).toEqual(['b']);
  });

  it('keeps aria-current from the source link', () => {
    const props = treeFromElement(
      makeContainer(
        {},
        `<ul>
          <li data-id="a"><a href="/a" aria-current="page">A</a></li>
          <li data-id="b"><a href="/b" aria-current="false">B</a></li>
          <li data-id="c"><a href="/c">C</a></li>
        </ul>`
      )
    );
    expect(props.items).toEqual([
      { id: 'a', label: 'A', href: '/a', current: 'page' },
      { id: 'b', label: 'B', href: '/b' },
      { id: 'c', label: 'C', href: '/c' },
    ]);
  });

  it('reads a link wrapped in another element', () => {
    const props = treeFromElement(
      makeContainer(
        {},
        `<ul>
          <li data-id="a">
            <span><a href="/a" aria-current="page">A</a></span>
            <ul><li data-id="a1"><span><a href="/a1">A1</a></span></li></ul>
          </li>
        </ul>`
      )
    );
    expect(props.items).toEqual([
      {
        id: 'a',
        label: 'A',
        href: '/a',
        current: 'page',
        children: [{ id: 'a1', label: 'A1', href: '/a1' }],
      },
    ]);
    expect(props.defaultSelectedId).toBe('a');
  });

  it('labels an image-only link from its aria-label or image alt', () => {
    const props = treeFromElement(
      makeContainer(
        {},
        `<ul>
          <li><a href="/a" aria-label="Home"><img src="x.png" alt="Logo"></a></li>
          <li><a href="/b"> <img src="x.png" alt="Reports"> </a></li>
        </ul>`
      )
    );
    expect(props.items.map(item => item.label)).toEqual(['Home', 'Reports']);
  });

  it('drops unsafe link URLs but keeps the label', () => {
    const props = treeFromElement(
      makeContainer(
        {},
        `<ul>
          <li><a href="javascript:alert(1)">Script</a></li>
          <li><a href=" java&#9;script:alert(1)">Tabbed</a></li>
          <li><a href="data:text/html,hi">Data</a></li>
          <li><a href="vbscript:msgbox(1)">VBScript</a></li>
          <li><a href=" JavaScript:alert(1)">Mixed case</a></li>
          <li><a href="&#1;javascript:alert(1)">Control character</a></li>
          <li><a href="https://www.undrr.org/">Safe</a></li>
        </ul>`
      )
    );
    expect(props.items.map(item => item.href)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'https://www.undrr.org/',
    ]);
    expect(props.items[0].label).toBe('Script');
  });

  it('reads labels as text, not markup', () => {
    const props = treeFromElement(
      makeContainer(
        {},
        '<ul><li><strong>Bold</strong> <img src=x onerror="1">item</li></ul>'
      )
    );
    expect(props.items[0].label).toBe('Bold item');
  });

  it('makes duplicate ids unique', () => {
    const props = treeFromElement(
      makeContainer(
        {},
        '<ul><li data-id="x">One</li><li data-id="x">Two</li><li data-id="x">Three</li></ul>'
      )
    );
    expect(props.items.map(item => item.id)).toEqual(['x', 'x-2', 'x-3']);
  });

  it('accepts an ordered list', () => {
    const props = treeFromElement(
      makeContainer({}, '<ol><li>First</li><li>Second</li></ol>')
    );
    expect(props.items).toEqual([
      { id: '1', label: 'First' },
      { id: '2', label: 'Second' },
    ]);
  });
});
