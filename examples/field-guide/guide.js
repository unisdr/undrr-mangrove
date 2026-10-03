const $ = selector => document.querySelector(selector);
const pages = [...document.querySelectorAll('.mg-guide__page')];
const properties = {
  undrr: 'Global hub for disaster risk reduction',
  preventionweb: 'Knowledge for disaster risk reduction',
  mcr: 'Making Cities Resilient 2030',
  irp: 'International Recovery Platform',
  delta: 'Data-driven resilience assessment',
};
const swatches = [
  [
    'Primary action',
    '--mg-color-button-background',
    'Use the primary action treatment for the clearest next step.',
  ],
  [
    'Hero',
    '--mg-color-hero',
    'A branded surface for the page’s leading message.',
  ],
  [
    'Tag',
    '--mg-color-tag',
    'Identify and group content with the documented tag treatment.',
  ],
  [
    'Secondary',
    '--mg-color-secondary',
    'A supporting brand colour. Check the text pairing before using it as a surface.',
  ],
  [
    'Body text',
    '--mg-color-neutral-800',
    'A shared neutral for readable body text on light surfaces.',
  ],
];
let dictionary;
let tokenMap;
let theme = 'undrr';
let chapter = 'start';
let chosenSwatch = 0;
let routeRevision = 0;
let messageTimer;
let application = 'social';
const applications = {
  social: {
    ratio: 'Social / 1.91:1',
    title: 'A message worth sharing',
    intent: 'Introduce the idea to people who may meet it for the first time.',
    decisions: [
      'The short prevention message leads in a solid colour panel.',
      'The image supplies human context without carrying text.',
      'A white signature area protects the mark; the Sendai rule stays thin.',
    ],
  },
  web: {
    ratio: 'Web / landing page',
    title: 'From attention to a next step',
    intent: 'Turn the shared message into an invitation to learn and act.',
    decisions: [
      'The property name and institutional signature occupy separate header areas.',
      'The headline, supporting line and next step form one clear hierarchy.',
      'Three resources continue the story beneath the hero.',
    ],
  },
  guide: {
    ratio: 'Guide / A4 cover and interior',
    title: 'Make room for deeper reading',
    intent: 'Give practitioners a durable reference they can return to.',
    decisions: [
      'The title sits in the upper third with generous margins.',
      'The photograph connects the guide with its purpose; the footer carries ownership.',
      'The interior quietens the colour and organises advice into practical steps.',
    ],
  },
  learning: {
    ratio: 'Learning / 16:9',
    title: 'Frame a conversation',
    intent: 'Help a facilitator connect people’s experience with evidence.',
    decisions: [
      'A question invites participation before a process is explained.',
      'Three steps use hierarchy and labels rather than decorative colour.',
      'The image panel keeps context visible while the footer holds ownership and a concept label.',
    ],
  },
};

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function announce(text) {
  clearTimeout(messageTimer);
  $('#status').textContent = text;
  messageTimer = setTimeout(() => {
    $('#status').textContent = '';
  }, 5000);
}
function tokenExpression(name) {
  return tokenMap.get(name).wrapInRgb ? `rgb(var(${name}))` : `var(${name})`;
}
function resolvedValue(name, brand, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Circular token reference: ${name}`);
  const token = tokenMap.get(name);
  if (!token) throw new Error(`Unknown token: ${name}`);
  const value = token.values[brand];
  if (value === undefined) return '';
  return value.replace(/var\((--[\w-]+)\)/g, (_, reference) =>
    resolvedValue(reference, brand, new Set([...seen, name]))
  );
}
function colour(name, brand) {
  const token = tokenMap.get(name);
  const value = resolvedValue(name, brand);
  return token.wrapInRgb ? `rgb(${value})` : value;
}
function luminance(rgb) {
  const channels = rgb.map(value => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function rgbOf(value) {
  const probe = element('span');
  probe.style.color = value;
  probe.hidden = true;
  document.body.append(probe);
  const result = getComputedStyle(probe)
    .color.match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
  probe.remove();
  return result;
}
function cssDeclaration(name) {
  const token = tokenMap.get(name);
  const property =
    token.type === 'color'
      ? 'color'
      : [
          ['--mg-font-size-', 'font-size'],
          ['--mg-font-line-height-', 'line-height'],
          ['--mg-spacing-', 'gap'],
          ['--mg-radius-', 'border-radius'],
          ['--mg-padding-', 'padding'],
          ['--mg-z-index-', 'z-index'],
          ['--mg-opacity-', 'opacity'],
        ].find(([prefix]) => name.startsWith(prefix))?.[1];
  // Not every token has a safe generic usage property (for example a z-index).
  return property
    ? `${property}: ${tokenExpression(name)};`
    : `${name}: ${token.values[theme]};`;
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    announce('Copied to clipboard.');
  } catch {
    announce('Clipboard unavailable. Select and copy the visible example.');
  }
}
function navigate(id) {
  location.hash = `${id}/${$('#theme').value}`;
}
function setTheme(id) {
  location.hash = `${chapter}/${id}`;
}

function showChapter(id, focus = false) {
  chapter = id;
  const index = pages.findIndex(page => page.id === chapter);
  for (const page of pages) page.hidden = page.id !== chapter;
  $('#chapter-name').textContent = pages[index].dataset.title;
  $('#page-count').textContent =
    `${String(index + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
  $('#progress').style.width = `${((index + 1) / pages.length) * 100}%`;
  $('#prev').disabled = index === 0;
  $('#next-page').disabled = index === pages.length - 1;
  document.title = `${pages[index].dataset.title} · Mangrove field guide`;
  for (const button of $('#chapter-links').children) {
    if (button.dataset.go === chapter)
      button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  if (focus) {
    $('#book').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}
function turn(amount) {
  const index = pages.findIndex(page => page.id === chapter);
  const next = pages[index + amount];
  if (next) navigate(next.id);
}
function paintIdentity() {
  const container = $('#identity-cards');
  container.replaceChildren();
  for (const id of Object.keys(properties)) {
    const metadata = dictionary.brands[id];
    const button = element('button', undefined, 'mg-guide__identity-card');
    button.dataset.theme = id;
    button.setAttribute('aria-pressed', String(id === theme));
    button.style.setProperty(
      '--leaf-colour',
      colour('--mg-color-button-background', id)
    );
    const swatch = element('i');
    swatch.setAttribute('aria-hidden', 'true');
    button.append(
      swatch,
      element('strong', metadata.title),
      element('small', properties[id])
    );
    container.append(button);
    const leaf = document.querySelector(`.mg-guide__leaf[data-theme="${id}"]`);
    leaf.style.setProperty(
      '--leaf-colour',
      colour('--mg-color-button-background', id)
    );
    leaf.setAttribute('aria-pressed', String(id === theme));
  }
}
function paintApplication() {
  const selected = applications[application];
  $('#application-ratio').textContent = selected.ratio;
  $('#application-title').textContent = selected.title;
  $('#application-intent').textContent = selected.intent;
  $('#application-decisions').replaceChildren(
    ...selected.decisions.map(text => element('li', text))
  );
  for (const id of Object.keys(applications)) {
    $(`#lookbook-${id}`).hidden = id !== application;
  }
  document
    .querySelectorAll('[data-format]')
    .forEach(button =>
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.format === application)
      )
    );
  document.querySelectorAll('[data-property-name]').forEach(label => {
    label.textContent = dictionary.brands[theme].title;
  });
}
function paintSwatches() {
  $('#swatches').replaceChildren();
  swatches.forEach(([title, name], index) => {
    const button = element('button', undefined, 'mg-guide__swatch');
    button.dataset.swatch = index;
    button.style.setProperty('--swatch', tokenExpression(name));
    button.setAttribute('aria-pressed', String(index === chosenSwatch));
    const chip = element('i');
    chip.setAttribute('aria-hidden', 'true');
    button.append(
      chip,
      element('strong', title),
      element('small', colour(name, theme))
    );
    $('#swatches').append(button);
  });
  paintColourDetail();
}
function paintColourDetail() {
  const [title, name, usage] = swatches[chosenSwatch];
  $('#swatch-title').textContent = title;
  $('#swatch-usage').textContent = usage;
  $('#swatch-code').textContent = `background-color: ${tokenExpression(name)};`;
  $('#contrast-sample').style.backgroundColor = tokenExpression(name);
  $('#contrast-sample').style.color = tokenExpression('--mg-color-button');
  const computed = getComputedStyle($('#contrast-sample'));
  const foreground = luminance(rgbOf(computed.color));
  const background = luminance(rgbOf(computed.backgroundColor));
  const ratio =
    (Math.max(foreground, background) + 0.05) /
    (Math.min(foreground, background) + 0.05);
  $('#contrast-result').textContent =
    `${ratio.toFixed(2)}:1 · ${ratio >= 4.5 ? 'Passes' : 'Below'} AA normal-text contrast for this pairing.`;
  [...$('#swatches').children].forEach((button, index) =>
    button.setAttribute('aria-pressed', String(index === chosenSwatch))
  );
}
function paintReference() {
  const query = $('#token-search').value.trim().toLowerCase();
  const tokens = dictionary.tokens.filter(
    token =>
      token.values[theme] !== undefined &&
      `${token.name} ${token.values[theme]} ${token.description || ''}`
        .toLowerCase()
        .includes(query)
  );
  $('#token-count').textContent =
    `${tokens.length} tokens · ${dictionary.brands[theme].title} · Generated from the current YAML sources`;
  const rows = document.createDocumentFragment();
  for (const token of tokens) {
    const row = element('tr');
    const nameCell = element('td');
    const button = element('button');
    button.append(element('code', token.name));
    button.title = cssDeclaration(token.name);
    button.setAttribute('aria-label', `Copy ${token.name} declaration`);
    button.addEventListener('click', () => copy(cssDeclaration(token.name)));
    nameCell.append(button);
    if (token.description) nameCell.append(element('small', token.description));
    const valueCell = element('td');
    valueCell.append(element('code', token.values[theme]));
    row.append(nameCell, valueCell, element('td', token.format));
    rows.append(row);
  }
  if (!tokens.length) {
    const cell = element('td', 'No matching tokens. Try another search.');
    cell.colSpan = 3;
    const row = element('tr');
    row.append(cell);
    rows.append(row);
  }
  $('#token-rows').replaceChildren(rows);
}
function paintRecipe() {
  const cssFile = theme === 'undrr' ? 'style.css' : `style-${theme}.css`;
  const themeClass =
    theme === 'undrr' ? 'mg-body' : `mg-body mg-theme-${theme}`;
  const recipes = {
    html: `<!-- Load your compiled Mangrove theme bundle. -->\n<link rel="stylesheet" href="/css/${cssFile}">\n<div class="${themeClass}">\n  <a href="/resources"\n     class="mg-button mg-button-primary">\n    Explore resources\n  </a>\n  <span class="mg-tag">Knowledge</span>\n</div>`,
    react: `import { CtaButton } from\n  '@undrr/undrr-mangrove/components/CtaButton.js';\n\n// Load the matching Mangrove stylesheet.\n<CtaButton\n  label="Explore resources"\n  Type="Primary"\n  href="/resources"\n/>`,
    css: `.project-action {\n  /* A complete colour expression: no rgb() wrapper. */\n  background-color: var(--mg-color-button-background);\n  /* Channel triplet: wrap in rgb(). */\n  color: rgb(var(--mg-color-button));\n  font-family: var(--mg-font-family-text);\n  padding: var(--mg-padding-button);\n  border-radius: var(--mg-radius-button);\n}`,
  };
  $('#recipe').textContent = recipes[$('#integration').value];
}
function paintPreview() {
  $('#preview').src =
    `specimen.html?theme=${theme}&pattern=${$('#pattern').value}`;
  $('#preview-wrap').dataset.width = $('#viewport').value;
}
function paintType() {
  const arabic = $('#language').value === 'ar';
  $('#type-specimen').lang = arabic ? 'ar' : 'en';
  $('#type-specimen').dir = arabic ? 'rtl' : 'ltr';
  $('#display-text').textContent = $('#sample-text').value;
  $('#body-text').textContent = arabic
    ? 'تبدأ القرارات الأفضل بالمعرفة المشتركة. نعمل معاً للحد من مخاطر الكوارث وبناء القدرة على الصمود.'
    : 'Better decisions begin with shared knowledge. Put the key message first, then give people the detail they need to act.';
  $('#ui-text').textContent = arabic
    ? 'المعرفة / العمل / القدرة على الصمود'
    : 'Knowledge / Action / Resilience';
}
async function route(focus = false) {
  const revision = ++routeRevision;
  const [requestedChapter, requestedTheme] = location.hash.slice(1).split('/');
  const nextChapter = pages.some(page => page.id === requestedChapter)
    ? requestedChapter
    : 'start';
  const nextTheme = dictionary.brands[requestedTheme]
    ? requestedTheme
    : 'undrr';
  const canonicalHash = `#${nextChapter}/${nextTheme}`;
  if (location.hash !== canonicalHash)
    history.replaceState(null, '', canonicalHash);
  showChapter(nextChapter, focus);
  $('#theme').value = nextTheme;
  if (nextTheme !== theme) {
    const previous = $('#theme-css');
    const stylesheet = element('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `assets/${nextTheme}.css`;
    try {
      await new Promise((resolve, reject) => {
        stylesheet.onload = resolve;
        stylesheet.onerror = () =>
          reject(new Error('The property stylesheet could not be loaded.'));
        previous.after(stylesheet);
      });
      if (revision !== routeRevision) {
        stylesheet.remove();
        return;
      }
      previous.remove();
      stylesheet.id = 'theme-css';
      theme = nextTheme;
      document.body.className = `mg-guide${theme === 'undrr' ? '' : ` mg-theme-${theme}`}`;
    } catch (error) {
      stylesheet.remove();
      $('#theme').value = theme;
      history.replaceState(null, '', `#${chapter}/${theme}`);
      announce(error.message);
      return;
    }
  }
  paintIdentity();
  paintApplication();
  paintSwatches();
  paintReference();
  paintRecipe();
  paintPreview();
}

try {
  const response = await fetch('tokens.json');
  if (!response.ok)
    throw new Error('The token dictionary could not be loaded.');
  dictionary = await response.json();
  tokenMap = new Map(dictionary.tokens.map(token => [token.name, token]));
  const initialStylesheet = $('#theme-css');
  if (!initialStylesheet.sheet)
    await new Promise((resolve, reject) => {
      initialStylesheet.addEventListener('load', resolve, { once: true });
      initialStylesheet.addEventListener(
        'error',
        () => reject(new Error('The base stylesheet could not be loaded.')),
        { once: true }
      );
    });
  pages.forEach((page, index) => {
    const button = element(
      'button',
      `${String(index).padStart(2, '0')}  ${page.dataset.title}`
    );
    button.dataset.go = page.id;
    $('#chapter-links').append(button);
  });
  document.addEventListener('click', event => {
    const go = event.target.closest('[data-go]');
    if (go) {
      $('#contents-dialog').close();
      navigate(go.dataset.go);
    }
    const property = event.target.closest('[data-theme]');
    if (property) setTheme(property.dataset.theme);
    const swatch = event.target.closest('[data-swatch]');
    if (swatch) {
      chosenSwatch = Number(swatch.dataset.swatch);
      paintColourDetail();
    }
    const format = event.target.closest('[data-format]');
    if (format) {
      application = format.dataset.format;
      paintApplication();
    }
  });
  $('#theme').addEventListener('change', () => setTheme($('#theme').value));
  $('.mg-guide__skip').addEventListener('click', event => {
    event.preventDefault();
    $('#book').focus();
  });
  $('#contents').addEventListener('click', () =>
    $('#contents-dialog').showModal()
  );
  $('#close-contents').addEventListener('click', () =>
    $('#contents-dialog').close()
  );
  $('#prev').addEventListener('click', () => turn(-1));
  $('#next-page').addEventListener('click', () => turn(1));
  $('#token-search').addEventListener('input', paintReference);
  $('#integration').addEventListener('change', paintRecipe);
  $('#copy-token').addEventListener('click', () =>
    copy($('#swatch-code').textContent)
  );
  $('#copy-recipe').addEventListener('click', () =>
    copy($('#recipe').textContent)
  );
  $('#pattern').addEventListener('change', paintPreview);
  $('#viewport').addEventListener('change', () => {
    $('#preview-wrap').dataset.width = $('#viewport').value;
  });
  $('#sample-text').addEventListener('input', paintType);
  $('#language').addEventListener('change', () => {
    $('#sample-text').value =
      $('#language').value === 'ar'
        ? 'نبني القدرة على الصمود معاً'
        : 'Building resilience together';
    paintType();
  });
  $('#print').addEventListener('click', () => window.print());
  window.addEventListener('hashchange', () => {
    route(true).catch(error => announce(error.message));
  });
  document.addEventListener('keydown', event => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      $('#contents-dialog').open ||
      event.target.closest('input, select, textarea, [contenteditable=true]')
    )
      return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      turn(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  await route();
} catch (error) {
  announce(
    `${error.message} Run the field guide build and serve the generated dist directory.`
  );
}
