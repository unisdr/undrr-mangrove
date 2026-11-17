// Compile and cache each theme in its own Vite chunk. Await the requested
// stylesheet before rendering a story or running its play function.
const themes = {
  'Global UNDRR Theme': {
    load: () => import('../stories/assets/scss/style.scss?inline'),
  },
  'PreventionWeb Theme': {
    load: () =>
      import('../stories/assets/scss/style-preventionweb.scss?inline'),
    className: 'mg-theme-preventionweb',
  },
  'IRP Theme': {
    load: () => import('../stories/assets/scss/style-irp.scss?inline'),
    className: 'mg-theme-irp',
  },
  'MCR2030 Theme': {
    load: () => import('../stories/assets/scss/style-mcr.scss?inline'),
    className: 'mg-theme-mcr',
  },
  'DELTA Resilience Theme': {
    load: () => import('../stories/assets/scss/style-delta.scss?inline'),
    className: 'mg-theme-delta',
  },
};

export const themeNames = Object.keys(themes);
const themeClasses = Object.values(themes).flatMap(theme =>
  theme.className ? [theme.className] : []
);
let activeTheme;
let activeStyle;
let request;
let disposed = false;

export function applyTheme(name = themeNames[0]) {
  const selected = Object.hasOwn(themes, name) ? name : themeNames[0];
  if (request?.name === selected) return request.ready;
  const next = { name: selected };
  request = next;
  next.ready = (async () => {
    try {
      const { default: css } = await themes[selected].load();
      if (disposed) return;
      // A slower response for a superseded selection must not replace the
      // newest stylesheet. Older loaders wait for the latest selection too.
      if (request !== next) return request?.ready;
      if (activeTheme !== selected) {
        const element = document.createElement('style');
        element.dataset.mangroveTheme = selected;
        element.textContent = css;
        document.head.appendChild(element);
        // HMR can create a fresh module instance before its predecessor is
        // disposed. Enforce ownership in the DOM as well as module state.
        document
          .querySelectorAll('style[data-mangrove-theme]')
          .forEach(style => {
            if (style !== element) style.remove();
          });
        activeStyle = element;
        activeTheme = selected;
      }
      document.body.classList.remove(...themeClasses);
      if (themes[selected].className) {
        document.body.classList.add(themes[selected].className);
      }
    } catch (error) {
      // Allow retries after a failed chunk request; leave the previous
      // working stylesheet visible while surfacing the failure to callers.
      if (request === next) request = undefined;
      throw error;
    }
  })();
  return next.ready;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposed = true;
    activeStyle?.remove();
  });
}
