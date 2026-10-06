(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const root = document.querySelector('.mg-demo-article-header');
  if (!root) throw Error('Missing actual article header');
  const fields = [
    'display',
    'position',
    'width',
    'height',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'lineHeight',
    'letterSpacing',
    'color',
    'backgroundColor',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'marginTop',
    'marginBottom',
    'marginLeft',
    'marginRight',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderTopColor',
    'borderRadius',
    'textAlign',
    'textWrapStyle',
    'textDecorationLine',
    'textUnderlineOffset',
    'textDecorationThickness',
    'flexDirection',
    'flexWrap',
    'justifyContent',
    'alignItems',
    'gap',
    'columnGap',
    'rowGap',
    'gridTemplateColumns',
    'gridTemplateRows',
    'objectFit',
    'objectPosition',
    'opacity',
    'boxShadow',
  ];
  const rect = n => {
    const r = n.getBoundingClientRect();
    return {
      x: r.x + scrollX,
      y: r.y + scrollY,
      width: r.width,
      height: r.height,
    };
  };
  const rec = n => {
    const s = getComputedStyle(n);
    return {
      tag: n.tagName,
      classes: n.className.baseVal ?? n.className,
      text: n.textContent,
      href: n.getAttribute('href'),
      src: n.getAttribute('src'),
      alt: n.getAttribute('alt'),
      rect: rect(n),
      style: Object.fromEntries(fields.map(f => [f, s[f]])),
      fragments: [...n.getClientRects()].map(r => ({
        x: r.x + scrollX,
        y: r.y + scrollY,
        width: r.width,
        height: r.height,
      })),
      children: [...n.children].map(rec),
    };
  };
  return {
    schema: 'news-image-header-current-source-v1',
    timestamp: new Date().toISOString(),
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    header: rec(root),
    images: [...root.querySelectorAll('img')].map(i => ({
      src: i.currentSrc,
      naturalWidth: i.naturalWidth,
      naturalHeight: i.naturalHeight,
      complete: i.complete,
      rect: rect(i),
    })),
    fonts: [...document.fonts]
      .filter(f => f.status === 'loaded')
      .map(f => ({ family: f.family, weight: f.weight, style: f.style })),
    fontRequests: performance
      .getEntriesByType('resource')
      .map(e => e.name)
      .filter(n => /\.(woff2?|ttf)(\?|$)/.test(n)),
    controlAliases: Object.fromEntries(
      [
        'accent',
        'border',
        'border-focus',
        'error',
        'muted-text',
        'option-hover',
        'option-selected',
        'surface',
        'surface-focus',
        'text',
      ].map(k => [
        '--mg-control-' + k,
        getComputedStyle(document.documentElement).getPropertyValue(
          '--mg-control-' + k
        ),
      ])
    ),
  };
})();
