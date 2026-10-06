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
    cards: [...document.querySelectorAll('#storybook-root .mg-card__vc')].map(card => {
      const a = card.querySelector('.mg-card__title a'),
        range = document.createRange();
      range.selectNodeContents(a);
      const textRects = [...range.getClientRects()].map(box);
      range.setStart(a.firstChild, a.firstChild.length - 1);
      range.setEnd(a.firstChild, a.firstChild.length);
      const s = getComputedStyle(a, '::after'),
        sourceAfter = Object.fromEntries(
          [...s].map(k => [k, s.getPropertyValue(k)])
        ),
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
      const beforeFragments = [...a.getClientRects()].map(box),
        span = document.createElement('span');
      for (const [k, v] of Object.entries(sourceAfter))
        span.style.setProperty(k, v);
      span.textContent = '\u2060';
      span.setAttribute('data-source-caret-diagnostic', '');
      const hide = document.createElement('style');
      hide.textContent =
        '.mg-source-caret-diagnostic::after{content:none!important;display:none!important}';
      document.head.appendChild(hide);
      a.classList.add('mg-source-caret-diagnostic');
      a.appendChild(span);
      const mirrorCaret = box(span.getBoundingClientRect()),
        mirrorFragments = [...a.getClientRects()].map(box);
      span.remove();
      a.classList.remove('mg-source-caret-diagnostic');
      hide.remove();
      return {
        mirrorCaret,
        mirrorFragments,
        sourceFragments: beforeFragments,
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
