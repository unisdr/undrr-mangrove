// Import theme SCSS files as lazy-loaded modules (via lazyStyleTag in main.js)
// These provide .use() and .unuse() methods to toggle styles on/off
import themeUNDRR from '../stories/assets/scss/style.scss';
import themePreventionWeb from '../stories/assets/scss/style-preventionweb.scss';
import themeIRP from '../stories/assets/scss/style-irp.scss';
import themeMCR from '../stories/assets/scss/style-mcr.scss';
import themeDelta from '../stories/assets/scss/style-delta.scss';

export default {
  'Global UNDRR Theme': themeUNDRR,
  'PreventionWeb Theme': themePreventionWeb,
  'IRP Theme': themeIRP,
  'MCR2030 Theme': themeMCR,
  'DELTA Resilience Theme': themeDelta,
};
