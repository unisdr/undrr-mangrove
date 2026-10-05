(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const properties = [
    'display',
    'boxSizing',
    'position',
    'fontFamily',
    'fontStyle',
    'fontWeight',
    'fontSize',
    'lineHeight',
    'letterSpacing',
    'color',
    'backgroundColor',
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'marginTop',
    'marginBottom',
    'marginLeft',
    'marginRight',
    'gap',
    'rowGap',
    'columnGap',
    'flexDirection',
    'flexWrap',
    'alignItems',
    'justifyContent',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderTopColor',
    'borderRadius',
    'textAlign',
    'textDecorationLine',
    'textDecorationThickness',
    'textUnderlineOffset',
    'textWrapStyle',
    'listStyleType',
    'listStylePosition',
    'overflowWrap',
    'maskImage',
    'maskSize',
    'maskRepeat',
  ];
  const box = n => {
    const r = n.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  };
  const style = (n, pseudo) => {
    const s = getComputedStyle(n, pseudo);
    return Object.fromEntries(properties.map(p => [p, s[p]]));
  };
  const record = n => ({
    tag: n.tagName,
    classes: n.className,
    text: n.textContent,
    href: n.getAttribute('href'),
    src: n.getAttribute('src'),
    ariaLabel: n.getAttribute('aria-label'),
    rect: box(n),
    style: style(n),
    before: style(n, '::before'),
    children: [...n.children].map(record),
  });
  const section = name =>
    [...document.querySelectorAll('main>section')].find(
      n => n.querySelector('h2')?.textContent === name
    );
  return {
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    nativeShare: typeof navigator.share === 'function',
    fonts: [...document.fonts]
      .filter(f => f.status === 'loaded')
      .map(f => ({ family: f.family, style: f.style, weight: f.weight })),
    intro: record(document.querySelector('.mg-demo-intro')),
    share: record(document.querySelector('.mg-share')),
    related: record(section('Related news and events')),
    recommendations: record(section("Editors' recommendations")),
    taxonomy: record(section('Explore further')),
    images: [...document.images]
      .filter(n => n.closest('main'))
      .map(n => ({
        src: n.currentSrc,
        loaded: n.complete && n.naturalWidth > 0,
        width: n.naturalWidth,
        height: n.naturalHeight,
      })),
  };
})();
