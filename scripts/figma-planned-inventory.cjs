'use strict';
/**
 * Documentation inventory, not component recipes or an acceptance registry.
 * One row per public source story file; named examples keep stable path/export
 * identities. Browser behaviour stories are not automatically visual variants.
 *
 * buildPlannedInventory(families, { coverage }) accepts explicit declarations:
 * { storyFile, familyId, variantIds: [...], storyExports: [...] }.
 * Both recipe variants and source exports must exist. A declared mapping means
 * source-scaffold coverage only, never native acceptance. New Card/Hero recipes
 * can declare their small initial mapping without hiding the remaining stories.
 *
 * Layout integration: read entries whose remainingExamples are nonempty, or
 * whose scaffoldFamilyIds are empty, and create a keyed FRAME/TEXT row per entry.
 * Use entry.id for row identity and wrap story labels into a summary. Never
 * create COMPONENT or COMPONENT_SET nodes for planned entries or use an export
 * name as proof of source appearance/interaction parity.
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const {
  isExportStory,
  storyNameFromExport,
  toId,
} = require('storybook/internal/csf');
const { loadCsf } = require('storybook/internal/csf-tools');
const ROOT = path.resolve(__dirname, '..');
const STORY_EXTENSION = /\.stories\.(?:js|jsx|ts|tsx)$/;

// Explicit associations resolve shared SCSS, missing family.source references,
// and the typography story file that contains real Details/Accordion examples.
// Association says a related scaffold exists, not that every story is covered.
const FAMILY_STORIES = {
  'card-vertical': 'Components/Cards/Card/VerticalCard',
  'card-horizontal': 'Components/Cards/Card/HorizontalCard',
  'hero-background': 'Components/Hero/Hero',
  'hero-split': 'Components/Hero/Hero',
  button: 'Components/Buttons/CtaButton/CtaButton',
  'editorial-cta': 'Components/Buttons/CtaButton/CtaButton',
  'text-input': 'Components/Forms/TextInput/TextInput',
  textarea: 'Components/Forms/Textarea/Textarea',
  combobox: 'Components/Forms/ComboBox/ComboBox',
  'combobox-option': 'Components/Forms/ComboBox/ComboBox',
  tabs: 'Components/Tab/Tab',
  'tabs-trigger': 'Components/Tab/Tab',
  table: 'Atom/Table/Table',
  'table-header-cell': 'Atom/Table/Table',
  'table-body-cell': 'Atom/Table/Table',
  'table-row': 'Atom/Table/Table',
  'text-cta': 'Components/TextCta/TextCta',
  radio: 'Components/Forms/Radio/Radio',
  checkbox: 'Components/Forms/Checkbox/Checkbox',
  switch: 'Components/Forms/Checkbox/Checkbox',
  'switch-small': 'Components/Forms/Checkbox/Checkbox',
  'form-error-summary': 'Components/Forms/FormErrorSummary/FormErrorSummary',
  chips: 'Components/Buttons/Chips/Chips',
  details: 'Atom/BaseTypography/BaseTypography',
  select: 'Components/Forms/Select/Select',
  loader: 'Utilities/Loader/Loader',
  'empty-state-compact': 'Atom/EmptyState/EmptyState',
  'toc-link': 'Components/TableOfContents/TableOfContents',
  'table-of-contents': 'Components/TableOfContents/TableOfContents',
  'status-label': 'Atom/StatusLabel/StatusLabel',
  'segmented-control.segment':
    'Components/Forms/SegmentedControl/SegmentedControl',
  'segmented-control.full-width-below-medium':
    'Components/Forms/SegmentedControl/SegmentedControl',
};
const EXCLUDED_COMPONENTS = new Map([
  [
    'Components/Hero/ChildHero',
    'Deprecated ChildHero reference, not a new production family; use current Hero.',
  ],
  [
    'Components/Boilerplate/Boilerplate',
    'Component-authoring template, not a reusable product component.',
  ],
  [
    'Components/TypeScriptExampleComponent/TypeScriptExampleComponent',
    'TypeScript authoring demonstration, not a product component.',
  ],
  [
    'Components/TypographyIntegration/TypographyIntegration',
    'Typography/language acceptance fixture, not a production component.',
  ],
  [
    'Components/PageTemplates/PageTemplateExample',
    'Component laboratory/page-template demonstration; reusable page patterns are inventoried separately.',
  ],
  [
    'Components/Forms/FormValidationExample/FormValidationExample',
    'Form-validation integration demonstration, not a separate reusable control.',
  ],
  [
    'Utilities/PagePatterns/PagePatterns',
    'Reading is a CSS-composition demonstration wrapper; document the readable-width/sticky-contents layout in page specimens rather than a dummy reusable component.',
  ],
]);
// Additional source contracts are not necessarily separate named stories.
// These are documentation scopes, never recipes or accepted native variants.
const PENDING_VARIANT_SCOPES = {
  'Components/Cards/Card/VerticalCard': [
    'Linked titles and inline link hover/focus presentation.',
    'Related Book, Icon and Stats card families and equal-height card groups.',
  ],
  'Components/Cards/Card/HorizontalCard': [
    'Linked titles and inline link hover/focus presentation.',
    'Related Book, Icon and Stats card families and equal-height card groups.',
  ],
  'Components/Hero/Hero': [
    'Page variants and alternate one-half/two-thirds/one-third split ratios.',
    'Immersive, video and logo presentations; RTL and richer HTML content.',
  ],
};

const sourceId = file => file.replace(STORY_EXTENSION, '');
const shortPath = file => sourceId(file).replace(/^stories\//, '');
const fileLabel = title => {
  const parts = title.split('/');
  return parts.length > 2 && parts.at(-2) === 'Syndicated search'
    ? parts.slice(-2).join(' / ')
    : parts.at(-1);
};
function unwrap(node, bindings, seen = new Set()) {
  if (!node) return node;
  if (
    [
      'TSAsExpression',
      'TSSatisfiesExpression',
      'ParenthesizedExpression',
    ].includes(node.type)
  )
    return unwrap(node.expression, bindings, seen);
  if (
    node.type === 'Identifier' &&
    bindings.has(node.name) &&
    !seen.has(node.name)
  ) {
    seen.add(node.name);
    return unwrap(bindings.get(node.name), bindings, seen);
  }
  return node;
}
function property(object, name) {
  return object?.properties?.find(
    item =>
      item.type === 'ObjectProperty' &&
      !item.computed &&
      (item.key.name || item.key.value) === name
  )?.value;
}
function staticString(node) {
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type === 'TemplateLiteral' && !node.expressions.length)
    return node.quasis[0].value.cooked;
  return null;
}

// Only inspect identity annotations, never execute stories or imported code.
// Spreads/computed keys can replace these fields, so withhold their links.
function identityProperty(node, name, bindings) {
  node = unwrap(node, bindings);
  if (node?.type !== 'ObjectExpression') return { unknown: true };
  if (
    node.properties.some(item => item.type === 'SpreadElement' || item.computed)
  )
    return { unknown: true };
  const matches = node.properties.filter(
    item => (item.key?.name || item.key?.value) === name
  );
  if (matches.length > 1 || matches[0]?.type === 'ObjectMethod')
    return { unknown: true };
  return { value: unwrap(matches[0]?.value, bindings) };
}
function staticFilter(field, bindings) {
  if (field.unknown) return { unknown: true };
  if (!field.value) return {};
  const node = unwrap(field.value, bindings);
  if (node.type === 'RegExpLiteral') {
    // Stateful regular expressions depend on prior calls, not just this export.
    if (/[gy]/.test(node.flags)) return { unknown: true };
    return { value: new RegExp(node.pattern, node.flags) };
  }
  if (node.type === 'ArrayExpression') {
    const values = node.elements.map(item =>
      staticString(unwrap(item, bindings))
    );
    if (values.every(item => item !== null)) return { value: values };
  }
  return { unknown: true };
}
function previewIdentity(
  name,
  declaration,
  metaId,
  title,
  bindings,
  unsafe,
  indexInputs
) {
  let reason = unsafe;
  let override;
  const node = unwrap(declaration, bindings);
  if (!reason && node?.type === 'ObjectExpression') {
    const parameters = identityProperty(node, 'parameters', bindings);
    const deprecated = identityProperty(node, 'story', bindings);
    if (parameters.unknown || deprecated.unknown || deprecated.value)
      reason = 'Unsupported dynamic or deprecated story identity annotations.';
    else if (parameters.value) {
      const id = identityProperty(parameters.value, '__id', bindings);
      if (id.unknown || (id.value && !staticString(id.value)))
        reason = 'Story parameters.__id is not a supported static string.';
      else override = staticString(id.value);
    }
  } else if (
    !reason &&
    ![
      'ArrowFunctionExpression',
      'FunctionExpression',
      'FunctionDeclaration',
    ].includes(node?.type) &&
    !(
      node?.type === 'CallExpression' &&
      node.callee.type === 'MemberExpression' &&
      !node.callee.computed &&
      node.callee.property.name === 'bind'
    )
  )
    reason =
      'Story declaration needs a built Storybook index to verify its ID.';
  if (reason) return { previewUnavailableReason: reason };
  const storybookId =
    override || toId(metaId || title, storyNameFromExport(name));
  if (indexInputs?.get(name) !== storybookId)
    return {
      previewUnavailableReason:
        'Static identity does not match the installed Storybook indexer.',
    };
  return {
    storybookId,
    previewUrl: `https://mangrove.undrr.org/?path=/story/${encodeURIComponent(storybookId)}`,
    previewKind: 'reference-preview',
    previewVerification: 'source-csf',
  };
}

function parseStorySource(file, source) {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
  const bindings = new Map();
  const exports = [];
  const locals = new Map();
  const mutations = new Set();
  let meta;
  for (const statement of ast.program.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration'
        ? statement.declaration
        : statement;
    if (declaration?.type === 'VariableDeclaration')
      for (const item of declaration.declarations)
        if (item.id.type === 'Identifier') {
          bindings.set(item.id.name, item.init);
          if (statement.type === 'ExportNamedDeclaration')
            (exports.push(item.id.name),
              locals.set(item.id.name, item.id.name));
        }
    if (
      statement.type === 'ExportNamedDeclaration' &&
      statement.exportKind !== 'type'
    ) {
      if (
        ['FunctionDeclaration', 'ClassDeclaration'].includes(
          declaration?.type
        ) &&
        declaration.id
      )
        (exports.push(declaration.id.name),
          locals.set(declaration.id.name, declaration.id.name),
          bindings.set(declaration.id.name, declaration));
      for (const item of statement.specifiers)
        if (item.exportKind !== 'type') {
          const name = item.exported.name || item.exported.value;
          exports.push(name);
          if (!statement.source) locals.set(name, item.local.name);
        }
    }
    if (statement.type === 'ExportDefaultDeclaration')
      meta = statement.declaration;
    const assignment =
      statement.type === 'ExpressionStatement' && statement.expression;
    if (assignment?.type === 'AssignmentExpression') {
      let member = assignment.left;
      const keys = [];
      while (member.type === 'MemberExpression') {
        keys.push(
          member.computed ? staticString(member.property) : member.property.name
        );
        member = member.object;
      }
      if (
        member.type === 'Identifier' &&
        keys.some(
          key =>
            !key ||
            [
              'parameters',
              'story',
              'id',
              'includeStories',
              'excludeStories',
            ].includes(key)
        )
      )
        mutations.add(member.name);
    }
  }
  const metaLocal = meta?.type === 'Identifier' && meta.name;
  meta = unwrap(meta, bindings);
  const title = staticString(unwrap(property(meta, 'title'), bindings));
  if (!title)
    throw new Error(
      `Planned inventory needs a static Storybook title: ${file}`
    );
  if (new Set(exports).size !== exports.length)
    throw new Error(`Duplicate source story exports: ${file}`);
  let indexInputs;
  try {
    indexInputs = new Map(
      loadCsf(source, { fileName: file, makeTitle: value => value })
        .parse()
        .indexInputs.filter(
          item => item.type === 'story' && item.subtype === 'story'
        )
        .map(item => [item.exportName, item.__id])
    );
  } catch {
    // Keep the source inventory usable, but never guess an unindexed URL.
  }
  const metaId = identityProperty(meta, 'id', bindings);
  const include = staticFilter(
    identityProperty(meta, 'includeStories', bindings),
    bindings
  );
  const exclude = staticFilter(
    identityProperty(meta, 'excludeStories', bindings),
    bindings
  );
  const unsafe =
    metaId.unknown ||
    (metaId.value && staticString(metaId.value) === null) ||
    include.unknown ||
    exclude.unknown ||
    mutations.has(metaLocal)
      ? 'Storybook meta identity or export filters need a built index to verify.'
      : null;
  const excludedExports = [];
  const stories = exports
    .filter(name => {
      const included =
        name !== '__namedExportsOrder' &&
        isExportStory(
          name,
          unsafe
            ? {}
            : { includeStories: include.value, excludeStories: exclude.value }
        );
      if (!included) excludedExports.push(name);
      return included;
    })
    .map(name => ({
      id: `${sourceId(file)}/${name}`,
      exportName: name,
      ...previewIdentity(
        name,
        bindings.get(locals.get(name)),
        staticString(metaId.value),
        title,
        bindings,
        unsafe ||
          (mutations.has(locals.get(name))
            ? 'Story identity is assigned outside its static declaration.'
            : null),
        indexInputs
      ),
    }));
  return { file, title, stories, excludedExports };
}

function scanStorySources(repoRoot) {
  const files = [];
  const walk = directory => {
    for (const entry of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(filename);
      else if (entry.isFile() && STORY_EXTENSION.test(entry.name)) {
        const file = path
          .relative(repoRoot, filename)
          .split(path.sep)
          .join('/');
        files.push(parseStorySource(file, fs.readFileSync(filename, 'utf8')));
      }
    }
  };
  walk(path.join(repoRoot, 'stories'));
  return files;
}

function classify(story) {
  const file = shortPath(story.file);
  if (file.startsWith('Documentation/'))
    return {
      excluded:
        'Documentation/research/brand specimens, not public component stubs.',
    };
  if (EXCLUDED_COMPONENTS.has(file))
    return { excluded: EXCLUDED_COMPONENTS.get(file) };
  if (file === 'Atom/BaseTypography/BaseTypography')
    return {
      label: 'Details and Accordion',
      kind: 'component',
      groupId: 'navigation',
      storyFilter: /Details|Accordion/,
    };
  if (/^Atom\/(?:BaseTypography|Typography|Layout|Icons|Logo)\//.test(file))
    return {
      excluded:
        'Foundation typography, layout or asset catalogue; use variables/styles/specimens rather than dummy component stubs.',
    };
  if (
    file.startsWith('Utilities/') &&
    !/^Utilities\/(?:Loader|SkipLink|ShowMore|EmbedContainer)\//.test(file)
  )
    return {
      excluded:
        'CSS reset/layout/utility-class documentation, not a separate reusable component.',
    };
  const groupId =
    file.startsWith('Patterns/') || /ErrorPages/.test(file)
      ? 'page-patterns'
      : /(?:Forms|UserFeedback)/.test(file)
        ? 'forms-selection'
        : /Buttons\//.test(file)
          ? 'actions'
          : /(?:Navigation|Breadcrumbs|Pager|MegaMenu|Tab\/|OnThisPageNav|TableOfContents|SkipLink)/.test(
                file
              )
            ? 'navigation'
            : 'content-data';
  return {
    kind:
      groupId === 'page-patterns' || /ErrorPages/.test(file)
        ? 'page-pattern'
        : 'component',
    groupId,
  };
}

function buildPlannedInventory(
  families,
  { coverage = [], repoRoot = ROOT } = {}
) {
  if (!Array.isArray(families) || !Array.isArray(coverage))
    throw new Error(
      'Planned inventory needs recipe families and explicit coverage arrays.'
    );
  const registry = new Map();
  for (const family of families) {
    if (
      !family?.id ||
      registry.has(family.id) ||
      !Array.isArray(family.variants)
    )
      throw new Error(
        'Duplicate or malformed recipe family in planned inventory.'
      );
    registry.set(family.id, family);
  }
  const scanned = scanStorySources(repoRoot);
  const excluded = [],
    entries = [];
  for (const story of scanned) {
    const classification = classify(story);
    if (classification.excluded) {
      excluded.push({ source: story.file, reason: classification.excluded });
      continue;
    }
    const selected = classification.storyFilter
      ? story.stories.filter(item =>
          classification.storyFilter.test(item.exportName)
        )
      : story.stories;
    if (!selected.length) {
      excluded.push({
        source: story.file,
        reason: 'No named public source examples in the selected scope.',
      });
      continue;
    }
    const associated = families.filter(family => {
      const declared = FAMILY_STORIES[family.id];
      if (declared) return declared === shortPath(story.file);
      const source =
        typeof family.source === 'string' ? family.source : family.source?.file;
      return (
        source &&
        /\.(?:jsx?|tsx?)$/.test(source) &&
        source.replace(/\.(?:jsx?|tsx?)$/, '') === sourceId(story.file)
      );
    });
    entries.push({
      id: sourceId(story.file),
      label: classification.label || fileLabel(story.title),
      catalogueTitle: story.title,
      source: story.file,
      kind: classification.kind,
      groupId: classification.groupId,
      representation: 'documentation-only',
      nativeAcceptance: 'unverified',
      pendingVariantScopes: [
        ...(PENDING_VARIANT_SCOPES[shortPath(story.file)] || []),
      ],
      scaffoldFamilyIds: associated.map(family => family.id),
      stories: selected.map(item => ({
        ...item,
        classification: 'source-example',
        nativeAcceptance: 'unverified',
        scaffoldMappings: [],
      })),
      excludedStoryExports: [
        ...story.excludedExports,
        ...story.stories
          .filter(item => !selected.includes(item))
          .map(item => item.exportName),
      ],
    });
  }
  const bySource = new Map(entries.map(entry => [entry.source, entry]));
  const seenCoverage = new Set();
  for (const declaration of coverage) {
    const entry = bySource.get(declaration.storyFile);
    const family = registry.get(declaration.familyId);
    if (
      !entry ||
      !family ||
      !Array.isArray(declaration.variantIds) ||
      !declaration.variantIds.length ||
      !Array.isArray(declaration.storyExports) ||
      !declaration.storyExports.length
    )
      throw new Error(
        'Coverage needs an included story file, existing family, recipe variant IDs and source export names.'
      );
    const knownVariants = new Set(family.variants.map(variant => variant.id));
    if (
      new Set(declaration.variantIds).size !== declaration.variantIds.length ||
      declaration.variantIds.some(id => !knownVariants.has(id))
    )
      throw new Error(
        `Unknown or duplicate recipe variant coverage: ${declaration.familyId}`
      );
    if (
      new Set(declaration.storyExports).size !== declaration.storyExports.length
    )
      throw new Error('Duplicate source story coverage.');
    for (const name of declaration.storyExports) {
      const story = entry.stories.find(item => item.exportName === name);
      const key = `${entry.id}/${name}/${family.id}`;
      if (!story || seenCoverage.has(key))
        throw new Error(`Unknown or duplicate source story coverage: ${name}`);
      seenCoverage.add(key);
      story.scaffoldMappings.push({
        familyId: family.id,
        variantIds: [...declaration.variantIds],
        status: 'source-scaffold-only',
      });
    }
    if (!entry.scaffoldFamilyIds.includes(family.id))
      entry.scaffoldFamilyIds.push(family.id);
  }
  for (const entry of entries) {
    entry.remainingExamples = entry.stories
      .filter(story => !story.scaffoldMappings.length)
      .map(story => ({ id: story.id, label: story.exportName }));
    entry.unverifiedMappedExamples = entry.stories
      .filter(story => story.scaffoldMappings.length)
      .map(story => ({ id: story.id, label: story.exportName }));
    entry.status = entry.scaffoldFamilyIds.length
      ? 'partial-source-scaffold'
      : 'not-scaffolded';
    entry.summary = entry.remainingExamples.length
      ? `Source examples still to map or verify: ${entry.remainingExamples.map(story => story.label).join(', ')}.`
      : 'Declared source mappings still need native verification; this is not an acceptance label.';
  }
  const relatedIds = new Set(entries.flatMap(entry => entry.scaffoldFamilyIds));
  return {
    version: 1,
    representation: 'documentation-only',
    sourcePreview: {
      baseUrl: 'https://mangrove.undrr.org',
      kind: 'reference-preview',
      verification: 'source-csf',
      limitations:
        'Links reference the public Storybook deployment. Its current branch, availability, brand and native Figma appearance are not verified; opening a link does not synchronise variables or components.',
    },
    scope:
      'Ordinary named Storybook examples. This is not a complete public API, MDX-only anatomy or native variant inventory. Source examples may exercise browser behaviour rather than a distinct visual variant.',
    sources: [
      'examples/figma-plugin/COMPONENT-INVENTORY.md',
      '.storybook/main.js',
    ],
    counts: {
      scannedStoryFiles: scanned.length,
      includedStoryFiles: entries.length,
      excludedStoryFiles: excluded.length,
      sourceExamples: entries.reduce(
        (total, entry) => total + entry.stories.length,
        0
      ),
      existingRecipeFamilies: families.length,
      filesWithoutScaffolds: entries.filter(
        entry => !entry.scaffoldFamilyIds.length
      ).length,
      mappedSourceExamples: entries.reduce(
        (total, entry) => total + entry.unverifiedMappedExamples.length,
        0
      ),
      examplesWithoutDeclaredMapping: entries.reduce(
        (total, entry) => total + entry.remainingExamples.length,
        0
      ),
      examplesStillToMapOrVerify: entries.reduce(
        (total, entry) => total + entry.stories.length,
        0
      ),
    },
    entries,
    excluded,
    unassociatedFamilyIds: families
      .filter(family => !relatedIds.has(family.id))
      .map(family => family.id),
  };
}

module.exports = { buildPlannedInventory, parseStorySource };
