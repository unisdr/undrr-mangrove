// Spike adapter: ?inline compiles Sass and rewrites asset URLs without
// automatically injecting all five mutually exclusive theme stylesheets.
import undrr from '../stories/assets/scss/style.scss?inline';
import preventionweb from '../stories/assets/scss/style-preventionweb.scss?inline';
import irp from '../stories/assets/scss/style-irp.scss?inline';
import mcr from '../stories/assets/scss/style-mcr.scss?inline';
import delta from '../stories/assets/scss/style-delta.scss?inline';

const themeStyle = (name, css) => {
  const element = document.createElement('style');
  element.dataset.mangroveTheme = name;
  element.textContent = css;
  return {
    use: () => document.head.appendChild(element),
    unuse: () => element.remove(),
  };
};

const themeStyles = {
  'Global UNDRR Theme': themeStyle('undrr', undrr),
  'PreventionWeb Theme': themeStyle('preventionweb', preventionweb),
  'IRP Theme': themeStyle('irp', irp),
  'MCR2030 Theme': themeStyle('mcr', mcr),
  'DELTA Resilience Theme': themeStyle('delta', delta),
};

// Preview modules are re-evaluated after inline Sass updates. Remove the
// previous module's style elements before its replacement attaches new ones.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    Object.values(themeStyles).forEach(style => style.unuse());
  });
}

export default themeStyles;
