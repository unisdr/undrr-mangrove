(() => {
  const root = document.querySelector('#storybook-root > div');
  if (!root) throw Error('Missing actual source root');
  const fields = [
    'display',
    'visibility',
    'opacity',
    'position',
    'boxSizing',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'fontStretch',
    'fontVariationSettings',
    'lineHeight',
    'letterSpacing',
    'textAlign',
    'textTransform',
    'textWrapStyle',
    'textDecorationLine',
    'textDecorationColor',
    'textDecorationThickness',
    'textUnderlineOffset',
    'color',
    'backgroundColor',
    'backgroundImage',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomLeftRadius',
    'borderBottomRightRadius',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'gap',
    'rowGap',
    'columnGap',
    'flexDirection',
    'flexWrap',
    'alignItems',
    'justifyContent',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'width',
    'height',
    'overflow',
    'overflowX',
    'overflowY',
    'objectFit',
    'objectPosition',
    'transformOrigin',
    'aspectRatio',
    'left',
    'right',
    'top',
    'bottom',
    'boxShadow',
    'backdropFilter',
    'transform',
    'clipPath',
    'maskImage',
    'maskSize',
    'maskPosition',
    'content',
    'outline','outlineWidth','outlineColor','outlineStyle','outlineOffset','filter',
    'gridTemplateColumns', 'gridTemplateRows', 'gridRow', 'maskRepeat', 'fontKerning', 'fontFeatureSettings', 'fontVariantLigatures', 'textWrapMode', 'whiteSpace',
    'gridColumn',
    'zIndex',
  ];
  const style = (node, pseudo) => {
    const s = getComputedStyle(node, pseudo);
    return Object.fromEntries(fields.map(k => [k, s[k]]));
  };
  const rect = node => node.getBoundingClientRect().toJSON();
  const nodes = [];
  function walk(node, id, parentId) {
    const textNodes = Array.from(node.childNodes).filter(
      n => n.nodeType === 3 && n.textContent.length
    );
    const texts = textNodes.map((n, index) => {
      const r = document.createRange();
      r.selectNodeContents(n);
      return {
        id: id + '/text' + index,
        characters: n.textContent,
        rect: r.getBoundingClientRect().toJSON(),
        rects: Array.from(r.getClientRects()).map(v => v.toJSON()),
      };
    });
    nodes.push({
      id,
      parentId,
      tag: node.tagName,
      classes:
        typeof node.className === 'string'
          ? node.className
          : node.className.baseVal,
      rect: rect(node),
      disabled: node.disabled ?? null,
      input: node.tagName==='INPUT'?{value:node.value,type:node.type,inputMode:node.inputMode,autocomplete:node.autocomplete,placeholder:node.placeholder,selectionStart:node.selectionStart,selectionEnd:node.selectionEnd,spellcheck:node.spellcheck}:null,
      inert:node.inert,
      ariaSelected: node.getAttribute('aria-selected'),
      scroll: {
        top: node.scrollTop,
        left: node.scrollLeft,
        width: node.scrollWidth,
        height: node.scrollHeight,
        clientWidth: node.clientWidth,
        clientHeight: node.clientHeight,
      },
      image:
        node.tagName === 'IMG'
          ? {
              authoredSrc: node.dataset.galleryAuthoredSrc || node.src,
              fixtureFile: node.dataset.galleryFixtureFile || null,
              fixtureSha256: node.dataset.galleryFixtureSha256 || null,
              naturalWidth: node.naturalWidth,
              naturalHeight: node.naturalHeight,
              complete: node.complete,
            }
          : null,
      style: style(node),
      before: style(node, '::before'),
      after: style(node, '::after'),
      text: node.textContent,
      texts,
      href: node.getAttribute('href'),
      svg: node.tagName.toLowerCase() === 'svg' ? node.outerHTML : null,
      role: node.getAttribute('role'),
      ariaHidden: node.getAttribute('aria-hidden'),
      tabIndex: node.getAttribute('tabindex'),
      focusVisible: node.matches(':focus-visible'),
      focused: node === document.activeElement,
      childOrder: Array.from(node.childNodes).map(n =>
        n.nodeType === 3 ? { text: n.textContent } : { tag: n.tagName }
      ),
      outerHtml: node.outerHTML,
    });
    Array.from(node.children).forEach((n, i) => walk(n, id + '/node' + i, id));
  }
  walk(root, 'root', null);
  const computed = getComputedStyle(root);
  return JSON.stringify({
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    dpr: devicePixelRatio,
    fontStatus: document.fonts.status,
    fonts: Array.from(document.fonts).map(f => ({
      family: f.family,
      style: f.style,
      weight: f.weight,
      stretch: f.stretch,
      status: f.status,
    })),
    aliases: Object.fromEntries(
      [
        'text',
        'surface',
        'surface-focus',
        'border',
        'border-focus',
        'muted-text',
        'error',
        'accent',
        'option-hover',
        'option-selected',
      ].map(k => [k, computed.getPropertyValue('--mg-control-' + k)])
    ),
    rootSelector:root.className||root.id,
    host: {
      rect: rect(root.parentElement),
      style: style(root.parentElement),
      outerHtml: root.parentElement.outerHTML,
    },
    nodes,
    sourceComponentUnmodified: true,
    fixtureResponsesInstalled: false,
    mediaSrcRemappedOnly: false,
    mediaFixtureOverrides:[],
    body:{style:style(document.body),htmlStyle:style(document.documentElement),siblings:[...document.body.children].map(n=>({tag:n.tagName,id:n.id,classes:n.className,inert:n.inert,visibility:getComputedStyle(n).visibility}))},
    userAgent: navigator.userAgent,
    kind: 'actual-authored-preview-access-source-state-capture',
  });
})();
