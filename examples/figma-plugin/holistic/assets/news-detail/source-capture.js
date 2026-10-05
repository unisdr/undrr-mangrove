(async () => {
  await document.fonts.ready;
  await Promise.all(
    [...document.images].map(image => image.decode().catch(() => undefined))
  );
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const selectors = [
    '.mg-demo-shell',
    '.mg-page-main',
    '.mg-demo-article-header',
    '.mg-demo-intro',
    '.mg-demo-article-header figure',
    '.mg-demo-article-image',
    '.mg-image-caption',
    '.mg-reading',
    '.mg-reading>div',
    '.mg-reading__article',
    '.mg-reading__article>section',
    '.mg-reading__article>section>h2',
    '.mg-reading__article>section>p',
    '.mg-highlight-box',
    '.mg-highlight-box p',
    '.mg-highlight-box strong',
    '.mg-quote-highlight',
    '.mg-embed-container',
    '.mg-share',
    '.mg-share__header',
    '.mg-share__buttons',
    '.mg-share__button',
    '.mg-share__copy-button',
    '.mg-page-main>section',
    '.mg-page-main>section>h2',
    '.mg-page-main>section>ul',
    '.mg-page-main>section>ul>li',
    '.mg-page-main>section>p',
    '.mg-tag-container',
    '.mg-tag-container>a',
    '.mg-grid__col-3',
    '.mg-card',
    '.mg-user-feedback',
  ];
  const records = [];
  for (const selector of selectors) {
    for (const [index, n] of [
      ...document.querySelectorAll(selector),
    ].entries()) {
      const r = n.getBoundingClientRect(),
        s = getComputedStyle(n);
      records.push({
        selector,
        index,
        tag: n.tagName,
        cls: n.className,
        text: n.innerText,
        href: n.href || null,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        parent: n.parentElement.className,
        css: Object.fromEntries(
          [
            'display',
            'float',
            'clear',
            'gridTemplateColumns',
            'gap',
            'rowGap',
            'columnGap',
            'flexDirection',
            'flexWrap',
            'alignItems',
            'fontFamily',
            'fontSize',
            'fontWeight',
            'fontStyle',
            'lineHeight',
            'color',
            'backgroundColor',
            'boxShadow',
            'paddingTop',
            'paddingRight',
            'paddingBottom',
            'paddingLeft',
            'marginTop',
            'marginRight',
            'marginBottom',
            'marginLeft',
            'borderTopWidth',
            'borderRightWidth',
            'borderBottomWidth',
            'borderLeftWidth',
            'borderRadius',
            'aspectRatio',
            'textWrapStyle',
            'textDecorationLine',
            'overflow',
            'maxWidth',
          ].map(k => [k, s[k]])
        ),
      });
    }
  }
  const controlAliases = Object.fromEntries(
    [
      'text',
      'muted-text',
      'accent',
      'surface',
      'surface-focus',
      'border',
      'border-focus',
      'option-hover',
      'option-selected',
      'error',
    ].map(n => [
      '--mg-control-' + n,
      getComputedStyle(document.documentElement)
        .getPropertyValue('--mg-control-' + n)
        .trim(),
    ])
  );
  if (Object.values(controlAliases).some(v => !v))
    throw Error(
      'Current committed control aliases missing from active source stylesheet'
    );
  return {
    controlAliases,
    url: location.href,
    timestamp: new Date().toISOString(),
    viewport: { width: innerWidth, height: innerHeight },
    documentHeight: document.documentElement.scrollHeight,
    records,
    images: [...document.images].map(n => ({
      src: n.src,
      complete: n.complete,
      naturalWidth: n.naturalWidth,
      naturalHeight: n.naturalHeight,
      width: n.width,
      height: n.height,
    })),
    iframe: [...document.querySelectorAll('iframe')].map(n => ({
      src: n.src,
      title: n.title,
      allow: n.allow,
      rect: JSON.parse(JSON.stringify(n.getBoundingClientRect())),
    })),
    fonts: [...document.fonts]
      .filter(f => f.status === 'loaded')
      .map(f => ({ family: f.family, weight: f.weight, style: f.style })),
    fontRequests: performance
      .getEntriesByType('resource')
      .filter(r => /woff|ttf/.test(r.name))
      .map(r => r.name),
  };
})();
