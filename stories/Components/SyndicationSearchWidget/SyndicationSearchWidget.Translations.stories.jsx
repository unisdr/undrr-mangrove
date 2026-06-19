/**
 * @file SyndicationSearchWidget.Translations.stories.jsx
 * @description Stories demonstrating the `labels` prop for UI string translation.
 *
 * Every user-visible string in the widget is overridable via the `labels` prop.
 * Pass any subset of keys — unspecified keys fall back to the English defaults
 * from `DEFAULT_LABELS` in SearchContext.
 *
 * Dynamic strings use `{placeholder}` tokens, e.g.:
 *   `showingResults: 'Mostrando {start}–{end} de {total} resultados'`
 *
 * In a Drupal integration, supply translated labels from PHP via a data attribute
 * or inline JSON — the `fromElement` hydration layer passes them straight through.
 *
 * Languages provided:
 *   LABELS_ES — Spanish (neutral international / UN)
 *   LABELS_FR — French
 *   LABELS_JA — Japanese
 *   LABELS_ZH — Simplified Chinese
 *   LABELS_AR — Arabic (Modern Standard / MSA)
 *   LABELS_RU — Russian
 */

import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { defaultConfig, widgetMetaShared } from './_storyHelpers';

export default {
  title: 'Components/Syndicated search/Translations',
  component: SyndicationSearchWidget,
  ...widgetMetaShared,
};

// ---------------------------------------------------------------------------
// Spanish (es) — neutral international Spanish, UN register
// ---------------------------------------------------------------------------
import {
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_ZH,
  LABELS_AR,
  LABELS_RU,
} from './_labels';

// ---------------------------------------------------------------------------
// Stories — one per language
// ---------------------------------------------------------------------------

const storyDescription = lang => `
Translated widget UI via the \`labels\` prop (${lang}).

Pass any subset of keys — omitted keys fall back to the English defaults.
Dynamic strings use \`{placeholder}\` tokens; function-valued keys enable complex plural forms
(Arabic, Russian) but cannot be serialized to JSON for the \`data-labels\` attribute.

Use the label objects in this file as a copy-paste reference for your own translations module.

\`\`\`jsx
// Copy the relevant LABELS_${lang} object from this file into your own
// translations module (any export name works). Never import from .stories files.
import { SyndicationSearchWidget } from '@undrr/undrr-mangrove';
import { labels } from './translations/${lang.toLowerCase()}';

<SyndicationSearchWidget config={config} labels={labels} />
\`\`\`
`;

export const Spanish = {
  args: { config: defaultConfig, labels: LABELS_ES },
  parameters: { docs: { description: { story: storyDescription('ES') } } },
};

export const French = {
  args: { config: defaultConfig, labels: LABELS_FR },
  parameters: { docs: { description: { story: storyDescription('FR') } } },
};

export const Japanese = {
  args: { config: defaultConfig, labels: LABELS_JA },
  parameters: { docs: { description: { story: storyDescription('JA') } } },
};

export const Chinese = {
  args: { config: defaultConfig, labels: LABELS_ZH },
  parameters: { docs: { description: { story: storyDescription('ZH') } } },
};

export const Arabic = {
  args: { config: defaultConfig, labels: LABELS_AR },
  parameters: { docs: { description: { story: storyDescription('AR') } } },
};

export const Russian = {
  args: { config: defaultConfig, labels: LABELS_RU },
  parameters: { docs: { description: { story: storyDescription('RU') } } },
};
