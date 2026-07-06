// Main entry point for the component library

// Hydration runtime
export { default as createHydrator } from './hydrate.js';

// Component exports
export { default as CookieConsentBanner } from '../stories/Components/CookieConsentBanner';
export { default as ShareButtons } from '../stories/Components/Buttons/ShareButtons/ShareButtons';
export { default as MegaMenu } from '../stories/Components/MegaMenu/MegaMenu';
export { default as ScrollContainer } from '../stories/Components/ScrollContainer/ScrollContainer';
export { default as QuoteHighlight } from '../stories/Components/QuoteHighlight/QuoteHighlight';
// CodeBlock is a Storybook documentation component (syntax highlighting via react-syntax-highlighter).
// Drupal pages use Prism.js directly; no .hydrate.js/.fromElement.js needed for server-side blocks.
export { CodeBlock } from '../stories/Components/CodeBlock/CodeBlock';
export { default as SyndicationSearchWidget } from '../stories/Components/SyndicationSearchWidget/SyndicationSearchWidget';
export { DEFAULT_LABELS, interpolateLabel } from '../stories/Components/SyndicationSearchWidget/context/SearchContext';
export { Gallery } from '../stories/Components/Gallery/Gallery';
export { default as IconCard } from '../stories/Components/Cards/IconCard/IconCard';
export { default as StatsCard } from '../stories/Components/Cards/StatsCard/StatsCard';
export { default as Pager } from '../stories/Components/Pager/Pager';
export { default as TextCta } from '../stories/Components/TextCta/TextCta';
export { default as Snackbar } from '../stories/Components/Snackbar/Snackbar';
export { default as FeaturePromo } from '../stories/Components/FeaturePromo/FeaturePromo';

// Import global styles
import '../stories/assets/scss/style.scss';
