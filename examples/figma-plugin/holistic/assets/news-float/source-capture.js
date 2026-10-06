(async () => {
  await document.fonts.ready;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const box = document.querySelector('.mg-reading__article .mg-highlight-box'),
    p = box?.querySelector('p');
  if (!box || !p) throw Error('Actual ArticleStory float missing');
  const style = n => {
    const s = getComputedStyle(n);
    return Object.fromEntries(
      [
        'color',
        'backgroundColor',
        'borderTopWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderLeftWidth',
        'borderTopColor',
        'boxShadow',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'fontStyle',
        'lineHeight',
        'letterSpacing',
        'paddingTop',
        'paddingBottom',
        'paddingLeft',
        'paddingRight',
        'marginTop',
        'marginBottom',
        'marginLeft',
        'marginRight',
        'float',
        'width',
        'height',
        'opacity',
        'textAlign',
        'textWrapStyle',
      ].map(k => [k, s[k]])
    );
  };
  const rect = n => ({ ...n.getBoundingClientRect().toJSON() });
  const describe = n => ({
    tag: n.tagName,
    classes: n.className,
    text: n.textContent.replace(/\s+/g, ' ').trim(),
    html: n.innerHTML,
    style: style(n),
    rect: rect(n),
    children: [...n.children].map(describe),
  });
  const fragments = [],
    walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode,
      range = document.createRange();
    range.selectNodeContents(n);
    fragments.push({
      text: n.textContent,
      parentTag: n.parentElement.tagName,
      parentStyle: style(n.parentElement),
      rects: [...range.getClientRects()].map(r => ({ ...r.toJSON() })),
    });
  }
  const article = document.querySelector('.mg-reading__article'),
    next = document
      .querySelectorAll('.mg-reading__article>section')[2]
      .querySelector('p');
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
    throw Error('Current CSS aliases missing');
  return {
    schema: 'article-float-source-v1',
    timestamp: new Date().toISOString(),
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    controlAliases,
    box: describe(box),
    paragraph: describe(p),
    fragments,
    article: { rect: rect(article), style: style(article) },
    followingParagraph: {
      text: next.textContent.replace(/\s+/g, ' ').trim(),
      rect: rect(next),
      style: style(next),
    },
    fonts: [...document.fonts].map(f => ({
      family: f.family,
      style: f.style,
      weight: f.weight,
      status: f.status,
    })),
    fontRequests: performance
      .getEntriesByType('resource')
      .filter(e => /woff|ttf/i.test(e.name))
      .map(e => e.name),
  };
})();
