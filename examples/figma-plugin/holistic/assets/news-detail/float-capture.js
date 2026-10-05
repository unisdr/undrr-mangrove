(async () => {
  await document.fonts.ready;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const paragraph = document
      .querySelectorAll('.mg-reading__article>section')[2]
      .querySelector('p'),
    walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT),
    fragments = [];
  while (walker.nextNode()) {
    const n = walker.currentNode,
      range = document.createRange();
    range.selectNodeContents(n);
    for (const rect of range.getClientRects())
      fragments.push({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        text: n.textContent,
      });
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
    navigatorShare: typeof navigator.share === 'function',
    shareActions: [...document.querySelectorAll('.mg-share__button')].map(n =>
      n.getAttribute('aria-label')
    ),
    paragraph: paragraph.innerText,
    fragments,
    box: {
      ...document
        .querySelector('.mg-highlight-box')
        .getBoundingClientRect()
        .toJSON(),
    },
  };
})();
