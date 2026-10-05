/**
 * Consumer guidance for the recorded local UNDRR kit, separate from anatomy.
 *
 * buildKitGuidance(families) requires the complete known recipe family array.
 * It returns schema version1:
 * - scope: the brand and common acceptance boundary, plus family counts;
 * - groups: {id,label,familyIds}, ordered primary browsing entries only;
 * - families: every family once, in widget-first task order, with id, label,
 *   groupId, kind (primary/support), optional parentFamilyId/supportRole,
 *   status (bounded-draft/outside-core/source-scaffold), purpose, usage, supported[],
 *   limitations[], docsUrl, a full native description and a compact connectorDescription.
 *
 * Support parts remain construction families. Their presence does not imply
 * an additional public widget or broader acceptance of their parent.
 * Unknown, duplicate or missing source families require an explicit guidance
 * update. There is no generic acceptance fallback and no recipe mutation.
 */
'use strict';

const DOCS =
  'https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/CORE-KIT-STATUS.md';
const GROUPS = [
  { id: 'actions', label: 'Actions' },
  { id: 'forms-selection', label: 'Forms and selection' },
  { id: 'content-data', label: 'Content and data' },
  { id: 'navigation', label: 'Navigation and disclosure' },
];
const SCOPE =
  'Local UNDRR source presets with bounded native evidence. A reviewed 25-family core is published for the Professional pilot; Card, Hero, Tabs and Editorial CTA remain local and unpublished. Maintain design changes at meaningful releases. Other brands/scripts, arbitrary content or widths, browser behaviour, font-file/pixel equivalence and uncoached novice handoff need separate acceptance.';

// Status follows CORE-KIT-STATUS.md, not older construction descriptions.
// Geometry and font details remain in source recipes; this is usage guidance.
const ENTRIES = [
  {
    id: 'card-vertical',
    label: 'Card / Vertical',
    groupId: 'content-data',
    status: 'source-scaffold',
    purpose: 'Introduce editorial content with optional media and an action.',
    usage:
      'Choose a declared orientation, viewport and colour treatment; edit text and optional visibility on a linked instance. In Layers, expand the Card instance > mg-card / source layout > mg-card__visual, select that frame, then open its Image fill to upload media.',
    supported: [
      'Source-derived unlinked Vertical presets; editable content and a linked button-only editorial action. Horizontal is an advanced orientation alternative.',
    ],
    limitations: [
      'New scaffold: native consumer and rendered acceptance are recorded separately from the existing core preset.',
      'Book, Icon and Stats cards, responsive browser behaviour, rich HTML and group equal-height behaviour remain separate scopes.',
    ],
  },
  {
    id: 'hero-background',
    label: 'Hero / Background',
    groupId: 'content-data',
    status: 'source-scaffold',
    purpose: 'Lead a page or feature with a headline, photograph and actions.',
    usage:
      'Choose an explicit source layout and viewport preset. Edit headline and supporting content, replace media and keep actions linked. Choose Heading Page for h1 or Section for h2. Background media: select mg-hero / background image on Desktop, or mobile composition > banner image on Phone. Split media: split-grid > mg-hero__media. Open Image fill > Upload from computer. A resize does not switch breakpoints.',
    supported: [
      'Source-derived background layouts with native image fills and declared Page or Section heading presets. Split layouts are an advanced alternative.',
    ],
    limitations: [
      'New scaffold: native consumer and rendered acceptance are recorded separately from the existing core preset.',
      'Immersive, child hero, custom HTML, video, RTL and arbitrary responsive content remain separate scopes.',
    ],
  },
  {
    id: 'card-horizontal',
    label: 'Card / Horizontal',
    groupId: 'content-data',
    kind: 'support',
    parentFamilyId: 'card-vertical',
    supportRole: 'orientation-alternative',
    status: 'source-scaffold',
    purpose: 'Offer the source horizontal and phone-stacked card composition.',
    usage:
      'Choose Desktop or Mobile explicitly, edit unlinked content and retain the nested action.',
    supported: ['Four colour treatments at declared desktop and phone widths.'],
    limitations: [
      'New source scaffold; linked title, hover/focus and arbitrary resizing are separate acceptance scopes.',
    ],
  },
  {
    id: 'hero-split',
    label: 'Hero / Split',
    groupId: 'content-data',
    kind: 'support',
    parentFamilyId: 'hero-background',
    supportRole: 'layout-alternative',
    status: 'source-scaffold',
    purpose: 'Pair a source solid hero content panel with a photograph.',
    usage: 'Choose a declared desktop column ratio or mobile stacked preset.',
    supported: [
      'Section headings: four colour treatments, three desktop ratios and a stacked phone layout. Page headings: default 2/3 desktop ratio and stacked phone presets.',
    ],
    limitations: [
      'New source scaffold; no live video or custom HTML, browser grid reflow or arbitrary width/content guarantee.',
    ],
  },
  {
    id: 'button',
    label: 'Button',
    groupId: 'actions',
    purpose: 'Offer a primary or secondary action.',
    usage:
      'Choose emphasis, treatment and visual state; edit Label on a linked instance.',
    supported: [
      'Primary/Secondary, Filled/Outline and Default/Hover/Focus/Disabled.',
      'A normal Assets-inserted edited HUG instance and declared narrow review specimens are observed.',
    ],
    limitations: [
      'Keep declared sizing; arbitrary width or wrapping is not promised.',
      'Editorial, icon-only, ghost and responsive icon-label shapes are separate scopes.',
    ],
  },
  {
    id: 'text-cta',
    label: 'Text CTA',
    groupId: 'actions',
    purpose: 'Pair a promotional headline with an action.',
    usage:
      'Choose a declared layout; use the tested Mobile preset for Headline edits and keep the action linked.',
    supported: [
      'Six bounded layouts with action wrapping and balanced headlines.',
      'Edited Mobile Headline at 390px and fresh consumers retain source fields through two ordinary repeats.',
    ],
    limitations: [
      'Desktop consumer edits and arbitrary widths remain deferred.',
      'Additional colour/media/rich-content scopes are not represented by these six presets.',
    ],
  },
  {
    id: 'editorial-cta',
    label: 'Editorial CTA',
    groupId: 'actions',
    status: 'outside-core',
    purpose:
      'Represent the source editorial action and Hero contexts for repair and review.',
    usage:
      'Keep as a pending source specimen; use the bounded Button family for supported core actions.',
    supported: [
      'Source recipes and native assets exist for declared editorial/Hero contexts.',
    ],
    limitations: [
      'Canonical Default/Hover/Focus Label formatting is repaired; broader edited state-switch and resize contracts remain outside core acceptance.',
      'This family is outside core use; a plan upgrade does not repair it.',
    ],
  },
  {
    id: 'text-input',
    label: 'Text input',
    groupId: 'forms-selection',
    purpose: 'Collect a short single-line value.',
    usage:
      'Edit label/value and optional supporting text; choose a visual state and retain short field labels.',
    supported: [
      'Six source states, including filled, focused, invalid-focused and disabled, are built and basic consumers are observed.',
    ],
    limitations: [
      'Long required labels and long help/error flow remain deferred.',
      'Date, number, telephone and search chrome, scrolling and browser validation are not part of this visual contract.',
    ],
  },
  {
    id: 'textarea',
    label: 'Textarea',
    groupId: 'forms-selection',
    purpose: 'Collect multiline text.',
    usage:
      'Use the four-row source template or declared finite multiline specimen; edit Value and optional supporting text.',
    supported: [
      'Six source states and finite multiline specimens are observed.',
    ],
    limitations: [
      'Long labels/help/errors and inline required-marker wrapping remain deferred.',
      'User resize and scrolling are browser behaviour, not native component capabilities.',
    ],
  },
  {
    id: 'select',
    label: 'Select, closed',
    groupId: 'forms-selection',
    purpose: 'Show a closed selection control.',
    usage: 'Choose a source visual state and edit a short single-line Value.',
    supported: [
      'Five closed states; an edited Invalid specimen at 240px survives repeat.',
    ],
    limitations: [
      'No popup/options, platform-specific appearance or selection interaction is promised.',
      'Required-label wrapping and longer Value contracts remain deferred.',
    ],
  },
  {
    id: 'combobox',
    label: 'ComboBox',
    groupId: 'forms-selection',
    purpose: 'Combine an editable value with a list of choices.',
    usage:
      'Insert the complete ComboBox; edit exposed field text and its linked option instances.',
    supported: [
      'Six bounded control states, including an open list with exposed native options.',
      'Existing bounded edited-consumer and ordinary-rebuild evidence is recorded.',
    ],
    limitations: [
      'Filtering, dynamic option counts, scrolling and keyboard selection are deferred.',
      'Use declared field/content presets; long required-label flow remains a field limitation.',
    ],
  },
  {
    id: 'combobox-option',
    label: 'ComboBox option',
    groupId: 'forms-selection',
    parentFamilyId: 'combobox',
    kind: 'support',
    supportRole: 'part',
    purpose: 'Supply a selectable item inside ComboBox.',
    usage: 'Edit the exposed linked options inside the complete ComboBox.',
    supported: [
      'Selected/unselected Default/Hover/FocusVisible source visual recipes.',
    ],
    limitations: [
      'This is a supporting part, not a separate complete picker.',
      'The inward focus ring needs broader rendered acceptance; dynamic lists and interaction are deferred.',
    ],
  },
  {
    id: 'radio',
    label: 'Radio',
    groupId: 'forms-selection',
    purpose: 'Show one choice from a mutually exclusive set.',
    usage:
      'Choose checked/state and label position; use declared short or long/narrow presets.',
    supported: [
      'Checked inset, source state cascade and bounded widths are observed; an edited consumer survives rebuild.',
    ],
    limitations: [
      'Arbitrary width, grouped flow and browser selection behaviour are not promised.',
      'Keep source presets where flex shrinking changes the control shape.',
    ],
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    groupId: 'forms-selection',
    purpose: 'Show an independent selectable choice.',
    usage:
      'Choose checked/state and label position; edit the linked instance within a declared preset.',
    supported: [
      'Source checkmark vector, rounded control and bounded narrow source states are observed.',
    ],
    limitations: [
      'Broader focused narrow states and arbitrary resizing remain deferred.',
      'The native component represents a visual choice, not browser selection or validation.',
    ],
  },
  {
    id: 'switch',
    label: 'Switch',
    groupId: 'forms-selection',
    purpose: 'Show an on/off setting.',
    usage:
      'Choose checked/state; edit label and optional help/error text in a source preset. Small is an advanced size alternative.',
    supported: [
      'Bounded normal-size source states, including distinct disabled and aria-disabled appearances.',
    ],
    limitations: [
      'Pending/custom-size, motion, RTL and browser toggle behaviour remain deferred.',
      'Long content is supported only by the declared bounded presets.',
    ],
  },
  {
    id: 'switch-small',
    label: 'Switch, small',
    groupId: 'forms-selection',
    parentFamilyId: 'switch',
    kind: 'support',
    supportRole: 'size-alternative',
    purpose: 'Provide the source small-size alternative to Switch.',
    usage:
      'Choose this linked size alternative when the source small control is required; keep short content.',
    supported: [
      'Twenty bounded checked/state recipes with observed small-size source appearance.',
    ],
    limitations: [
      'This is a size alternative, not a second public toggle pattern.',
      'Pending/custom-size, long-content, motion and RTL contracts remain deferred.',
    ],
  },
  {
    id: 'segmented-control.full-width-below-medium',
    label: 'Segmented control',
    groupId: 'forms-selection',
    purpose: 'Show a labelled three-option single-choice group.',
    usage:
      'Use a Default FullWidth BelowMedium preset; edit Legend and the three exposed Labels, or hide/show Legend.',
    supported: [
      'Four declared selection presets and bounded 240/390px content edits.',
      'Legend reappearance, seams/corners and two ordinary repeats pass with edited/fresh cohorts.',
    ],
    limitations: [
      'Selection variant switching, composed Focus and Small remain separate scopes.',
      'Source wrapped-row origin and middle-focus overlap are unresolved beyond this bounded FullWidth composition.',
    ],
  },
  {
    id: 'segmented-control.segment',
    label: 'Segmented option',
    groupId: 'forms-selection',
    parentFamilyId: 'segmented-control.full-width-below-medium',
    kind: 'support',
    supportRole: 'part',
    purpose: 'Supply an endpoint or middle option inside Segmented control.',
    usage:
      'Prefer the complete group; use advanced parts only within its declared source construction.',
    supported: [
      'Thirty Default-size Selected/State/Position leaves pass five native State gates with edited/fresh consumers and two ordinary repeats.',
    ],
    limitations: [
      'Leaf acceptance does not establish neighbour focus stacking or wrapped group behaviour.',
      'Small and automatic layout/selection interaction remain deferred.',
    ],
  },
  {
    id: 'chips',
    label: 'Chips',
    groupId: 'forms-selection',
    purpose: 'Show a compact linked or dismissible label.',
    usage:
      'Choose linked or With X and edit Label; keep the intrinsic or declared finite-width preset.',
    supported: [
      'Source fonts, intrinsic/fixed presets and ordinary identity retention are observed.',
      'Edited Label at the source 240px preset passes two ordinary repeats with fresh consumers.',
    ],
    limitations: [
      'Other edited widths and combined interaction states remain deferred.',
      'There is no source Selected styling; disabled dismiss retains its source default appearance.',
    ],
  },
  {
    id: 'form-error-summary',
    label: 'Form error summary',
    groupId: 'forms-selection',
    purpose: 'Summarise validation errors and point to affected fields.',
    usage:
      'Choose a declared one/three-error preset; edit Title and error-link text.',
    supported: [
      'Underlined links and balanced titles are observed in ordinary and edited long consumers.',
    ],
    limitations: [
      'Wrapped individual-link focus remains deferred.',
      'Browser validation, field navigation and arbitrary error counts are not implemented by the native specimen.',
    ],
  },
  {
    id: 'table',
    label: 'Table',
    groupId: 'content-data',
    purpose: 'Present bounded three-column tabular content.',
    usage:
      'Choose a Short or declared Story/NarrowStory preset; edit the linked nested cell Labels.',
    supported: [
      'Eight finite presets with reusable Header/Body cells and rows; long/narrow specimens are observed.',
    ],
    limitations: [
      'Retain declared columns and row count; native presets do not implement HTML automatic table sizing.',
      'Arbitrary widths, row counts and consumer column resizing need separate acceptance.',
    ],
  },
  {
    id: 'table-header-cell',
    label: 'Table header cell',
    groupId: 'content-data',
    parentFamilyId: 'table',
    kind: 'support',
    supportRole: 'part',
    purpose: 'Supply a header label within Table.',
    usage:
      'Edit its exposed Label through the complete Table or compatible source Row.',
    supported: ['Large/Small and None/Grid-border supporting presets.'],
    limitations: [
      'A cell is not a complete table; preserve parent shared columns and row-height contracts.',
      'Automatic HTML intrinsic sizing and arbitrary nested resizing are not promised.',
    ],
  },
  {
    id: 'table-body-cell',
    label: 'Table body cell',
    groupId: 'content-data',
    parentFamilyId: 'table',
    kind: 'support',
    supportRole: 'part',
    purpose: 'Supply a data label within Table.',
    usage:
      'Edit its exposed Label through the complete Table or compatible source Row.',
    supported: ['Large/Small and None/Grid-border supporting presets.'],
    limitations: [
      'A cell is not a complete table; preserve parent shared columns and row-height contracts.',
      'Automatic HTML intrinsic sizing and arbitrary nested resizing are not promised.',
    ],
  },
  {
    id: 'table-row',
    label: 'Table row',
    groupId: 'content-data',
    parentFamilyId: 'table',
    kind: 'support',
    supportRole: 'part',
    purpose: 'Keep Table cells aligned to a shared source column preset.',
    usage:
      'Use rows inside the complete Table; edit linked cell Labels and retain the matching column preset.',
    supported: [
      'Declared size/treatment/header-or-body roles and Equal/Story/NarrowStory master geometry.',
    ],
    limitations: [
      'Short rows and content-growing Story rows have different source contracts.',
      'Arbitrary consumer column resizing and HTML layout algorithms remain deferred.',
    ],
  },
  {
    id: 'status-label',
    label: 'Status Label',
    groupId: 'content-data',
    purpose: 'Pair a status indicator with an authored label.',
    usage:
      'Choose one of the seven Status indicators and edit Label separately; status does not rename it.',
    supported: [
      'All seven source shapes, edited consumers and ordinary repeats pass bounded native gates.',
    ],
    limitations: [
      'Arbitrary multilingual wrapping, grouped layouts and matched raster pixels remain deferred.',
      'Status and Label are independently authored source values.',
    ],
  },
  {
    id: 'details',
    label: 'Details',
    groupId: 'navigation',
    purpose: 'Show a disclosure summary and optional paragraph.',
    usage:
      'Choose Open/Closed and a measured viewport typography preset; edit Title and Paragraph.',
    supported: [
      'Standalone styled Details states; edited long Title/Paragraph at 240px survives an ordinary repeat.',
    ],
    limitations: [
      'Grouped Accordion is a separate source pattern.',
      'Viewport presets are explicit, not automatic breakpoints or browser disclosure behaviour.',
    ],
  },
  {
    id: 'empty-state-compact',
    label: 'Empty State, compact',
    groupId: 'content-data',
    purpose:
      'Explain an empty result with a compact description and optional source media.',
    usage:
      'Choose surface/alignment, edit Description and use Show media within the tested 240/390px contract.',
    supported: [
      'Four source presets; edited Description and hide/edit/show media reflow pass two ordinary repeats with fresh consumers.',
    ],
    limitations: [
      'General Empty State title/actions and other content/widths remain deferred.',
      'The compact contract does not promise an arbitrary replaceable media slot.',
    ],
  },
  {
    id: 'loader',
    label: 'Loader, static',
    groupId: 'content-data',
    purpose: 'Show a static source loading indicator.',
    usage: 'Choose the declared BelowMedium or MediumUp size specimen.',
    supported: [
      'Two source sector/size presets are observed and retained on repeat.',
    ],
    limitations: [
      'Static only; animation and automatic breakpoint behaviour are deferred.',
      'Arbitrary ring/size edits, browser accessibility behaviour and pixel parity are separate scopes.',
    ],
  },
  {
    id: 'table-of-contents',
    label: 'Table of contents',
    groupId: 'navigation',
    purpose: 'List numbered destinations within an article.',
    usage:
      'Choose a declared width preset; edit Title and exposed linked item Labels.',
    supported: [
      'Three Numbered presets and bounded edited consumers at 240/390/900px retain fields and range colours through ordinary repeats.',
    ],
    limitations: [
      'Bulleted/overflow variants, arbitrary item counts and browser navigation remain deferred.',
      'Use the exposed text edits and declared width presets; changing source typography is outside this tested contract.',
    ],
  },
  {
    id: 'toc-link',
    label: 'Table of contents link',
    groupId: 'navigation',
    parentFamilyId: 'table-of-contents',
    kind: 'support',
    supportRole: 'part',
    purpose: 'Supply a stateful destination label inside Table of contents.',
    usage:
      'Edit the exposed linked item through the complete Numbered composition.',
    supported: [
      'Twelve declared width/state recipes; source typography, aliases and effective range paints pass bounded repeats.',
    ],
    limitations: [
      'This supporting Link is not a general-purpose public Link pattern.',
      'Use its linked Label edits; changing the source typography/style is outside this tested contract.',
    ],
  },
  {
    id: 'tabs',
    label: 'Tabs',
    groupId: 'navigation',
    status: 'outside-core',
    purpose:
      'Represent the source pill navigation rail pending exact-font acceptance.',
    usage:
      'Keep this family outside core use until its exact source font and rendered contract pass.',
    supported: [
      'A bounded horizontal three-trigger native rail exists as a source specimen.',
    ],
    limitations: [
      'Condensed font loading recovered; source font-file/raster equivalence and broader native state acceptance remain pending.',
      'Panels, scrolling/overflow, responsive disclosures and interaction are not accepted.',
    ],
  },
  {
    id: 'tabs-trigger',
    label: 'Tab trigger',
    groupId: 'navigation',
    parentFamilyId: 'tabs',
    kind: 'support',
    supportRole: 'part',
    status: 'outside-core',
    purpose: 'Supply a selected/unselected pill inside the pending Tabs rail.',
    usage:
      'Inspect only as a supporting part of the outside-core Tabs specimen.',
    supported: [
      'Six selected/unselected Default/Hover/Focus construction recipes.',
    ],
    limitations: [
      'Exact Condensed source font and broader native state acceptance remain pending.',
      'This is not an accepted standalone navigation component.',
    ],
  },
];

// Startup guidance has the same validated registry as the exporter. Input
// objects need only an id; source geometry and anatomy are never consulted.
const FAMILY_IDS = Object.freeze(ENTRIES.map(entry => entry.id));

function buildKitGuidance(families) {
  if (!Array.isArray(families))
    throw new Error('Kit guidance requires the complete recipe family array.');
  const expected = new Set(FAMILY_IDS);
  const received = new Set();
  for (const family of families) {
    if (!family || typeof family.id !== 'string' || !expected.has(family.id))
      throw new Error(
        `Unknown kit guidance family ${family?.id || '(missing id)'}; add explicit usage and acceptance guidance.`
      );
    if (received.has(family.id))
      throw new Error(`Duplicate kit guidance family ${family.id}.`);
    received.add(family.id);
  }
  const missing = [...expected].filter(id => !received.has(id));
  if (missing.length)
    throw new Error(
      `Missing kit guidance families: ${missing.join(', ')}. Use the complete source registry.`
    );
  const ordered = GROUPS.flatMap(group =>
    ENTRIES.filter(entry => entry.groupId === group.id)
  ).map(entry => {
    const value = {
      ...entry,
      kind: entry.kind || 'primary',
      status: entry.status || 'bounded-draft',
      supported: [...entry.supported],
      limitations: [...entry.limitations],
      docsUrl:
        entry.status === 'source-scaffold'
          ? DOCS.replace('CORE-KIT-STATUS.md', 'CARD-HERO-STATUS.md')
          : `${DOCS}#${entry.status === 'outside-core' ? 'deferred-and-blocked-work' : 'core-scope'}`,
    };
    value.description = [
      value.status === 'outside-core'
        ? 'Not in core scope.'
        : value.status === 'source-scaffold'
          ? 'New draft component. Native acceptance is separate from core use.'
          : 'Bounded draft use: local UNDRR source presets.',
      value.kind === 'support'
        ? `Supporting ${value.supportRole === 'size-alternative' ? 'size alternative' : 'part'} of ${ENTRIES.find(parent => parent.id === value.parentFamilyId).label}.`
        : '',
      value.purpose,
      `Use: ${value.usage}`,
      `Supported: ${value.supported.join(' ')}`,
      `Limits: ${value.limitations.join(' ')}`,
      `Scope and evidence: ${value.docsUrl}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    value.connectorDescription = [
      value.status === 'outside-core'
        ? 'Not in core scope.'
        : value.status === 'source-scaffold'
          ? 'New draft component. Native acceptance pending.'
          : 'Bounded UNDRR draft.',
      `Supported edits and limits: ${value.docsUrl}`,
    ].join('\n');
    return value;
  });
  return {
    version: 1,
    scope: {
      brandId: 'undrr',
      description: SCOPE,
      familyCount: ordered.length,
      primaryFamilyCount: ordered.filter(entry => entry.kind === 'primary')
        .length,
      coreFamilyCount: ordered.filter(entry => entry.status === 'bounded-draft')
        .length,
      outsideCoreFamilyCount: ordered.filter(
        entry => entry.status === 'outside-core'
      ).length,
      scaffoldFamilyCount: ordered.filter(
        entry => entry.status === 'source-scaffold'
      ).length,
    },
    groups: GROUPS.map(group => ({
      ...group,
      familyIds: ordered
        .filter(entry => entry.groupId === group.id && entry.kind === 'primary')
        .map(entry => entry.id),
    })),
    families: ordered,
  };
}

function buildDefaultKitGuidance() {
  return buildKitGuidance(FAMILY_IDS.map(id => ({ id })));
}

module.exports = { buildKitGuidance, buildDefaultKitGuidance, FAMILY_IDS };
