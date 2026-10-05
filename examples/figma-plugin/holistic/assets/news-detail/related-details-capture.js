(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const box = r => ({ x: r.x, y: r.y, width: r.width, height: r.height });
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
    throw Error('Current committed source aliases missing');
  return {
    controlAliases,
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    cards: [...document.querySelectorAll('main .mg-card__vc')].map(card => {
      const a = card.querySelector('.mg-card__title a'),
        range = document.createRange();
      range.selectNodeContents(a);
      const textRects = [...range.getClientRects()].map(box);
      range.setStart(a.firstChild, a.firstChild.length - 1);
      range.setEnd(a.firstChild, a.firstChild.length);
      const s = getComputedStyle(a, '::after'),
        computed = Object.fromEntries(
          [
            'boxShadow',
            'padding',
            'marginBottom',
            'borderRadius',
            'backgroundColor',
            'height',
            'width',
            'gap',
            'alignContent',
          ].map(k => [k, getComputedStyle(card)[k]])
        ),
        imageStyle = Object.fromEntries(
          [
            'objectFit',
            'objectPosition',
            'height',
            'width',
            'outline',
            'borderRadius',
          ].map(k => [k, getComputedStyle(card.querySelector('img'))[k]])
        );
      return {
        computed,
        imageStyle,
        title: a.textContent,
        card: box(card.getBoundingClientRect()),
        anchor: box(a.getBoundingClientRect()),
        anchorFragments: [...a.getClientRects()].map(box),
        textFragments: textRects,
        lastCharacter: box(range.getBoundingClientRect()),
        after: Object.fromEntries(
          [
            'content',
            'display',
            'width',
            'height',
            'borderTopWidth',
            'borderRightWidth',
            'borderBottomWidth',
            'borderLeftWidth',
            'marginInlineStart',
            'top',
            'transform',
            'verticalAlign',
            'color',
            'fontFamily',
            'fontSize',
            'lineHeight',
          ].map(k => [k, s[k]])
        ),
      };
    }),
    fonts: [...document.fonts]
      .filter(f => f.status === 'loaded')
      .map(f => ({ family: f.family, style: f.style, weight: f.weight })),
  };
})();
