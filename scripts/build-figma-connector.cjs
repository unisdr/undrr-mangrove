#!/usr/bin/env node
/** Build a bounded, self-contained Figma connector script from the plugin sources. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { minify } = require('terser');
const PLUGIN = path.resolve(__dirname, '../examples/figma-plugin');
const LIMIT = 50000;

// LZW codes over UTF-8 bytes, packed at the smallest fixed code width needed
// by this payload. The decoder uses only JavaScript, keeping the payload
// independent of Figma-specific base64 helpers. Width and count precede base64
// so padding bits cannot be mistaken for another dictionary code.
function compressJSON(value) {
  const input = Buffer.from(JSON.stringify(value), 'utf8').toString('latin1');
  const dictionary = new Map();
  const codes = [];
  let next = 256;
  let word = input[0] || '';
  for (let i = 1; i < input.length; i += 1) {
    const character = input[i];
    const combined = word + character;
    if (dictionary.has(combined)) word = combined;
    else {
      codes.push(word.length === 1 ? word.charCodeAt(0) : dictionary.get(word));
      if (next < 65536) dictionary.set(combined, next++);
      word = character;
    }
  }
  if (word)
    codes.push(word.length === 1 ? word.charCodeAt(0) : dictionary.get(word));
  const largest = codes.reduce((maximum, code) => Math.max(maximum, code), 0);
  const width = Math.max(8, Math.ceil(Math.log2(largest + 1)));
  const bytes = Buffer.alloc(Math.ceil((codes.length * width) / 8));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const code of codes) {
    buffer = (buffer << width) | code;
    bits += width;
    while (bits >= 8) {
      bits -= 8;
      bytes[index++] = (buffer >>> bits) & 255;
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits) bytes[index] = (buffer << (8 - bits)) & 255;
  return `${width}:${codes.length}:${bytes.toString('base64')}`;
}
function decompressJSON(encoded) {
  const header = /^(\d+):(\d+):/.exec(encoded);
  if (!header) throw new Error('Invalid connector data header');
  const width = Number(header[1]);
  const count = Number(header[2]);
  if (
    !Number.isInteger(width) ||
    width < 8 ||
    width > 16 ||
    !Number.isSafeInteger(count) ||
    count < 1
  )
    throw new Error('Invalid connector code width or count');
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = [];
  let bits = 0;
  let buffer = 0;
  for (const character of encoded.slice(header[0].length)) {
    if (character === '=') break;
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error('Invalid connector data encoding');
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 255);
    }
  }
  if (bytes.length !== Math.ceil((count * width) / 8))
    throw new Error('Invalid connector data length');
  const codes = [];
  bits = 0;
  buffer = 0;
  const mask = (1 << width) - 1;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= width && codes.length < count) {
      bits -= width;
      codes.push((buffer >>> bits) & mask);
    }
    buffer &= (1 << bits) - 1;
  }
  if (buffer !== 0) throw new Error('Invalid connector padding');
  const dictionary = Array.from({ length: 256 }, (_, index) =>
    String.fromCharCode(index)
  );
  let previous = dictionary[codes[0]];
  if (previous === undefined) throw new Error('Empty connector data');
  let decoded = previous;
  let next = 256;
  for (let i = 1; i < codes.length; i += 1) {
    const code = codes[i];
    const word =
      dictionary[code] || (code === next ? previous + previous[0] : null);
    if (word === null) throw new Error('Invalid connector dictionary code');
    decoded += word;
    if (next < 65536) dictionary[next++] = previous + word[0];
    previous = word;
  }
  const utf8 = Array.from(
    decoded,
    character => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`
  ).join('');
  return JSON.parse(decodeURIComponent(utf8));
}

function selectFamilies(doc, requested, variantIds) {
  const families = new Map(
    doc.components.families.map(family => [family.id, family])
  );
  const selected = new Set();
  const visiting = new Set();
  if (variantIds) {
    const selectedVariants = new Map();
    const root = families.get(requested[0]);
    if (!root) throw new Error(`Unknown component family ${requested[0]}`);
    for (const id of variantIds)
      if (!root.variants.some(variant => variant.id === id))
        throw new Error(`Unknown ${root.id} variant ${id}`);
    const matches = (variant, selector) =>
      Object.entries(selector).every(
        ([key, value]) => variant.properties?.[key] === value
      );
    function variantVisit(family, variant) {
      const key = `${family.id}/${variant.id}`;
      if (selectedVariants.get(family.id)?.has(variant.id)) return;
      if (visiting.has(family.id))
        throw new Error(`Recipe dependency cycle at ${key}`);
      visiting.add(family.id);
      function tree(node) {
        if (node.type === 'INSTANCE') {
          const dependency = families.get(node.family);
          if (!dependency)
            throw new Error(`Unknown component family ${node.family}`);
          const variants = dependency.variants.filter(item =>
            matches(item, node.variant || {})
          );
          if (variants.length !== 1)
            throw new Error(
              `Dependency ${node.family} needs one exact variant`
            );
          variantVisit(dependency, variants[0]);
        }
        (node.children || []).forEach(tree);
      }
      tree(variant.tree);
      visiting.delete(family.id);
      if (!selectedVariants.has(family.id))
        selectedVariants.set(family.id, new Set());
      selectedVariants.get(family.id).add(variant.id);
    }
    for (const variant of root.variants)
      if (variantIds.includes(variant.id)) variantVisit(root, variant);
    return [...selectedVariants].map(([id, ids]) => {
      const family = families.get(id);
      const variants = family.variants.filter(variant => ids.has(variant.id));
      return {
        ...family,
        variants,
        ...(family.review && {
          review: {
            ...family.review,
            // A scoped batch cannot validate specimens for omitted variants.
            specimens: (family.review.specimens || []).filter(specimen =>
              variants.some(variant => matches(variant, specimen.variant))
            ),
            ...(family.review.variantSurfaces &&
              typeof family.review.variantSurfaces === 'object' &&
              !Array.isArray(family.review.variantSurfaces) && {
                variantSurfaces: Object.fromEntries(
                  Object.entries(family.review.variantSurfaces).filter(([id]) =>
                    ids.has(id)
                  )
                ),
              }),
          },
        }),
      };
    });
  }
  function visit(id) {
    if (selected.has(id)) return;
    if (visiting.has(id)) throw new Error(`Recipe dependency cycle at ${id}`);
    const family = families.get(id);
    if (!family) throw new Error(`Unknown component family ${id}`);
    visiting.add(id);
    function tree(node) {
      if (node.type === 'INSTANCE') visit(node.family);
      (node.children || []).forEach(tree);
    }
    family.variants.forEach(variant => tree(variant.tree));
    visiting.delete(id);
    selected.add(id);
  }
  requested.forEach(visit);
  return [...selected].map(id => families.get(id));
}
function validateImportSource(doc, brandId) {
  // Share the plugin's pure preflight instead of maintaining a second schema.
  // This runs before compilation and has no Figma globals or write access.
  const source = fs.readFileSync(path.join(PLUGIN, 'importer.js'), 'utf8');
  const start = source.indexOf('function validateMangroveImport(');
  const end = source.indexOf('\nfunction mangroveAssetIndex(', start);
  if (start < 0 || end < 0)
    throw new Error(
      'Import preflight boundary changed. Update connector build.'
    );
  const validate = vm.runInNewContext(`(${source.slice(start, end)})`);
  validate(doc, [brandId]);
}
function importSelection(doc, brandId, selection) {
  validateImportSource(doc, brandId);
  const byId = new Map(doc.variables.map(spec => [spec.id, spec]));
  const byName = new Map(doc.variables.map(spec => [spec.name, spec]));
  const styles = [...doc.styles.text, ...doc.styles.effect];
  const styleById = new Map(styles.map(spec => [spec.id, spec]));
  const variableIds = new Set();
  const styleIds = new Set(
    selection
      ? selection.styleIds || []
      : styles
          .filter(spec => spec.recommended || doc.styles.effect.includes(spec))
          .map(spec => spec.id)
  );
  function visit(spec) {
    if (variableIds.has(spec.id)) return;
    if (spec.values[brandId] === undefined)
      throw new Error(`Import preflight: ${spec.name} has no ${brandId} value`);
    variableIds.add(spec.id);
    const value = spec.values[brandId];
    if (value && typeof value === 'object' && 'alias' in value)
      visit(byName.get(value.alias));
  }
  for (const id of selection ? selection.variableIds || [] : byId.keys()) {
    const spec = byId.get(id);
    if (!spec) throw new Error(`Unknown import variable ID ${id}`);
    visit(spec);
  }
  for (const id of styleIds) {
    const style = styleById.get(id);
    if (!style) throw new Error(`Unknown import style ID ${id}`);
    if (style.values[brandId] === undefined)
      throw new Error(
        `Import preflight: ${style.name} has no ${brandId} value`
      );
    const bindings = style.bindings
      ? Object.values(style.bindings)
      : style.values[brandId].flatMap(entry =>
          Object.values(entry.bindings || {})
        );
    bindings.forEach(name => visit(byName.get(name)));
  }
  return { variableIds, styleIds };
}
function subsetDocument(
  doc,
  operation,
  brandId,
  requested,
  variantIds,
  importScope
) {
  const mode = doc.modes.find(item => item.id === brandId);
  if (!mode) throw new Error(`Unknown brand ${brandId}`);
  const oneBrand = spec => ({
    ...spec,
    values: { [brandId]: spec.values[brandId] },
  });
  const base = {
    collection: doc.collection,
    modes: [mode],
    variables: [],
    styles: { text: [], effect: [] },
  };
  if (operation === 'build') {
    const families = selectFamilies(doc, requested, variantIds);
    const textIds = new Set();
    const effectIds = new Set();
    const directTemplateIds = new Set();
    const coincidentRings = [];
    function tree(node, family, variant) {
      if (node.type === 'INSTANCE' && node.properties !== undefined)
        throw new Error(
          'Nested instance property values must use overrides, not properties.'
        );
      const ring = node.focusRing;
      const focusedSegment =
        family.id === 'segmented-control.segment' &&
        node === variant.tree &&
        ['Focus', 'HoverFocus'].includes(variant.properties?.State);
      const extension =
        ring &&
        ['renderer', 'outerStroke', 'cornerBindings'].some(
          field => ring[field] !== undefined
        );
      if (
        (focusedSegment || extension) &&
        ring?.renderer !== 'COINCIDENT_SCALE'
      )
        throw new Error(
          'Connector preflight: unknown or missing COINCIDENT_SCALE source focus extension.'
        );
      if (node.textStyle) textIds.add(node.textStyle);
      if ('textStyleApplication' in node && node.textStyle)
        directTemplateIds.add(node.textStyle);
      if (node.effectStyle) effectIds.add(node.effectStyle);
      if (node.focusRing?.renderer === 'COINCIDENT_SCALE')
        coincidentRings.push(node.focusRing);
      (node.children || []).forEach(child => tree(child, family, variant));
    }
    families.forEach(family =>
      family.variants.forEach(variant => tree(variant.tree, family, variant))
    );
    base.components = { version: doc.components.version, families };
    // The bounded DTO carries consumer guidance as the existing description
    // field. Avoid a second registry and duplicate construction prose in packets.
    if (doc.kitGuidance) {
      const descriptions = new Map(
        doc.kitGuidance.families.map(item => [
          item.id,
          item.connectorDescription || item.description,
        ])
      );
      base.components.families = families.map(family => ({
        ...family,
        description: descriptions.get(family.id) || family.description,
      }));
    }
    base.styles.text = doc.styles.text
      .filter(style => textIds.has(style.id))
      .map(oneBrand);
    base.styles.effect = doc.styles.effect
      .filter(style => effectIds.has(style.id))
      .map(oneBrand);
    // DIRECT validation retains the exact source binding definitions and their
    // alias dependency closure. Native variables remain read-only in builds.
    const directVariables = new Set();
    function includeDirectVariable(name) {
      const matches = doc.variables.filter(variable => variable.name === name);
      if (matches.length !== 1)
        throw new Error(`Missing or ambiguous DIRECT source variable ${name}`);
      const variable = matches[0];
      if (directVariables.has(variable.id)) return;
      directVariables.add(variable.id);
      const value = variable.values?.[brandId];
      if (value?.alias) includeDirectVariable(value.alias);
    }
    for (const style of base.styles.text)
      if (directTemplateIds.has(style.id))
        for (const name of Object.values(style.bindings || {}))
          includeDirectVariable(name);
    // Preserve exact source definitions needed by the source-family focus
    // renderer. Traverse every source mode, while the DTO remains one brand.
    // Alias edges are typed and cycle-checked independently for each mode.
    const focusVariables = new Set();
    function includeFocusVariable(name, type, modeId, visiting = new Set()) {
      const matches = doc.variables.filter(variable => variable.name === name);
      const variable = matches[0];
      if (
        matches.length !== 1 ||
        variable.id !== name.replaceAll('/', '.') ||
        doc.variables.filter(value => value.id === variable.id).length !== 1 ||
        variable.type !== type ||
        visiting.has(variable.id)
      )
        throw new Error(
          `Missing, ambiguous, wrong-typed or cyclic COINCIDENT_SCALE source role ${name}`
        );
      visiting.add(variable.id);
      const value = variable.values?.[modeId];
      if (value && typeof value === 'object' && 'alias' in value) {
        if (Object.keys(value).length !== 1 || typeof value.alias !== 'string')
          throw new Error(
            `Malformed COINCIDENT_SCALE alias ${name} / ${modeId}`
          );
        focusVariables.add(variable.id);
        return includeFocusVariable(value.alias, type, modeId, visiting);
      }
      if (
        type === 'FLOAT'
          ? !Number.isFinite(value) || value < 0
          : !value ||
            Object.keys(value).length !== 4 ||
            !['r', 'g', 'b', 'a'].every(
              field =>
                Number.isFinite(value[field]) &&
                value[field] >= 0 &&
                value[field] <= 1
            )
      )
        throw new Error(
          `Invalid COINCIDENT_SCALE source value ${name} / ${modeId}`
        );
      focusVariables.add(variable.id);
      return value;
    }
    for (const ring of coincidentRings)
      for (const sourceMode of doc.modes) {
        includeFocusVariable(ring.color, 'COLOR', sourceMode.id);
        includeFocusVariable(ring.separatorColor, 'COLOR', sourceMode.id);
        const offset = includeFocusVariable(
            ring.offset,
            'FLOAT',
            sourceMode.id
          ),
          width = includeFocusVariable(ring.width, 'FLOAT', sourceMode.id),
          sum = includeFocusVariable(ring.outerStroke, 'FLOAT', sourceMode.id);
        if (!(offset > 0 && width > 0) || sum !== offset + width)
          throw new Error(
            `COINCIDENT_SCALE source outerStroke must equal offset+width for ${sourceMode.id}`
          );
        for (const name of Object.values(ring.cornerBindings || {}))
          includeFocusVariable(name, 'FLOAT', sourceMode.id);
      }
    base.variables = doc.variables
      .filter(
        variable =>
          directVariables.has(variable.id) || focusVariables.has(variable.id)
      )
      .map(oneBrand);
    return base;
  }
  if (operation === 'import') {
    const selected = importSelection(doc, brandId, importScope);
    base.variables = doc.variables
      .filter(spec => selected.variableIds.has(spec.id))
      .map(oneBrand);
    base.styles.text = doc.styles.text
      .filter(style => selected.styleIds.has(style.id))
      .map(oneBrand);
    base.styles.effect = doc.styles.effect
      .filter(style => selected.styleIds.has(style.id))
      .map(oneBrand);
    return base;
  }
  if (operation === 'diagnostics') {
    const wanted = new Set();
    const byName = new Map(
      doc.variables.flatMap(spec => [
        [spec.id, spec],
        [spec.name, spec],
      ])
    );
    function visit(id) {
      const spec = byName.get(id);
      if (!spec) throw new Error(`Missing diagnostic variable ${id}`);
      if (wanted.has(spec.id)) return;
      wanted.add(spec.id);
      const value = spec.values[brandId];
      if (value?.alias) visit(value.alias);
    }
    [
      'color.neutral-0',
      'color.neutral-100',
      'color.neutral-900',
      'font-size.300',
      'radius.form-input',
    ].forEach(visit);
    base.variables = doc.variables
      .filter(spec => wanted.has(spec.id))
      .map(oneBrand);
    base.styles.text = [
      oneBrand(
        doc.styles.text.find(
          style => style.bindings.fontFamily === 'font-family/text'
        )
      ),
    ];
    base.styles.effect = [
      oneBrand(doc.styles.effect.find(style => style.id === 'focus-ring')),
    ];
    return base;
  }
  return null;
}
function coreSource() {
  return fs.readFileSync(path.join(PLUGIN, 'importer.js'), 'utf8');
}

function specializeCore(source) {
  // The connector embeds its immutable DTO. Omit only the absent optional
  // profile validation; every text style still resets old spacing to zero.
  for (const [before, after] of [
    [
      'if (value.letterSpacing !== undefined) {',
      'if (MG_CONNECTOR_LETTER_SPACING && value.letterSpacing !== undefined) {',
    ],
    [
      'style.letterSpacing = value.letterSpacing || {',
      'style.letterSpacing = (MG_CONNECTOR_LETTER_SPACING && value.letterSpacing) || {',
    ],
  ]) {
    const start = source.indexOf(before);
    if (start < 0 || source.indexOf(before, start + before.length) >= 0)
      throw new Error(`Connector specialization boundary changed: ${before}`);
    source =
      source.slice(0, start) + after + source.slice(start + before.length);
  }
  return source;
}
function retainedLetterSpacing(subset) {
  let enabled = false;
  for (const spec of subset?.styles.text || [])
    for (const [mode, value] of Object.entries(spec.values || {})) {
      if (value?.letterSpacing === undefined) continue;
      enabled = true;
      const spacing = value.letterSpacing;
      if (
        !spacing ||
        !['PIXELS', 'PERCENT'].includes(spacing.unit) ||
        !Number.isFinite(spacing.value) ||
        Object.keys(spacing).some(key => !['unit', 'value'].includes(key))
      )
        throw new Error(
          `Connector preflight: ${spec.name} [${mode}]: invalid text style letter spacing`
        );
    }
  return enabled;
}
function svgPlanSource(source) {
  const before = 'function mgSvgPlan(tree) {',
    after = '\nfunction mgSvgTopology(node) {';
  const start = source.indexOf(before),
    end = source.indexOf(after, start);
  if (
    start < 0 ||
    end <= start ||
    source.indexOf(before, start + 1) >= 0 ||
    source.indexOf(after, end + 1) >= 0
  )
    throw new Error('Connector SVG plan specialization boundary changed.');
  return { start, end, source: source.slice(start, end) };
}
function verifiedSvgPlans(doc, source) {
  // Execute the desktop runtime's pure parser, not a second SVG schema. The
  // resulting plans supplement the original lossless SVG DTO. This is safe
  // only because connector input is embedded and immutable at execution time.
  const context = vm.createContext({});
  vm.runInContext(svgPlanSource(source).source, context, { timeout: 1000 });
  const plans = Object.create(null);
  function visit(tree) {
    if (tree.type === 'SVG') {
      context.tree = tree;
      const plan = JSON.parse(
        JSON.stringify(
          vm.runInContext('mgSvgPlan(tree)', context, { timeout: 1000 })
        )
      );
      if (plans[plan.assetId] && plans[plan.assetId].markup !== plan.markup)
        throw new Error(
          `SVG asset ${plan.assetId} has conflicting source markup. Use distinct asset IDs or an explicit SVG migration.`
        );
      plans[plan.assetId] = plan;
    }
    (tree.children || []).forEach(visit);
  }
  doc.components.families.forEach(family =>
    family.variants.forEach(variant => visit(variant.tree))
  );
  return plans;
}
function specializeBuilder(source, subset) {
  // The exact subset is embedded losslessly in this connector. Gate only
  // declarations absent from that subset, allowing Terser to remove helpers
  // otherwise retained by unconditional schema checks. Every enabled branch
  // keeps the desktop runtime's original validation. A changed source boundary
  // fails closed rather than silently omitting a guard.
  const replaceOnce = (before, after) => {
    const start = source.indexOf(before);
    if (start < 0 || source.indexOf(before, start + before.length) >= 0)
      throw new Error(`Connector specialization boundary changed: ${before}`);
    source =
      source.slice(0, start) + after + source.slice(start + before.length);
  };
  // selectFamilies has already traversed the exact retained dependency closure
  // with cycle/unknown-family guards. Keep every native maintenance-policy
  // check, but avoid repeating that immutable source traversal in Figma.
  replaceOnce(
    'mgMaintenanceAssertSource(\n    mgMaintenanceDependencyIds(recipes, selectedFamilyIds),\n    owned\n  );',
    `mgMaintenanceAssertSource(${JSON.stringify(subset.components.families.map(family => family.id))}, owned);`
  );
  const directFamilies = new Set();
  function directProfile(tree, familyId) {
    if (tree.textStyleApplication !== undefined) directFamilies.add(familyId);
    (tree.children || []).forEach(child => directProfile(child, familyId));
  }
  subset.components.families.forEach(family =>
    family.variants.forEach(variant => directProfile(variant.tree, family.id))
  );
  // Only the immutable family discriminator is specialized. Every applicable
  // source-anatomy/template guard and every native alias check stays intact.
  // An unknown or mixed DIRECT family retains both original profile branches.
  replaceOnce(
    "const editorial = family.id === 'editorial-cta';",
    directFamilies.size === 1 && directFamilies.has('editorial-cta')
      ? 'const editorial = true;'
      : directFamilies.size === 1 && directFamilies.has('toc-link')
        ? 'const editorial = false;'
        : "const editorial = family.id === 'editorial-cta';"
  );
  const svg = svgPlanSource(source);
  source =
    source.slice(0, svg.start) +
    'function mgSvgPlan(tree) { return {...doc.connectorSvgPlans[tree.svg.assetId]}; }\n' +
    source.slice(svg.end);
  for (const condition of [
    'tree.image !== undefined',
    'tree.gradient !== undefined',
    'imagePlans.has(spec)',
    'gradientPlans.has(spec)',
  ])
    replaceOnce(
      `if (${condition}) {`,
      `if (MG_CONNECTOR_MEDIA && ${condition}) {`
    );
  replaceOnce(
    "tree.type === 'FRAME' &&\n            tree.position !== undefined &&",
    "MG_CONNECTOR_FRAME_POSITION && tree.type === 'FRAME' &&\n            tree.position !== undefined &&"
  );
  replaceOnce(
    "spec.type === 'FRAME' &&\n      spec.position &&",
    "MG_CONNECTOR_FRAME_POSITION && spec.type === 'FRAME' &&\n      spec.position &&"
  );
  // The immutable embedded DTO has already passed this exact guard above.
  replaceOnce(
    "if (tree.type === 'INSTANCE' && tree.properties !== undefined)",
    'if (false)'
  );
  for (const name of [
    'imagePlans',
    'imageAssetSources',
    'imageHashes',
    'gradientPlans',
  ])
    replaceOnce(
      `const ${name} = new Map();`,
      `const ${name} = MG_CONNECTOR_MEDIA ? new Map() : null;`
    );
  replaceOnce(
    'if (tree.absolute !== undefined) {',
    'if (MG_CONNECTOR_ABSOLUTE && tree.absolute !== undefined) {'
  );
  replaceOnce(
    "if (tree.type === 'ELLIPSE') {",
    "if (MG_CONNECTOR_ELLIPSE && tree.type === 'ELLIPSE') {"
  );
  replaceOnce(
    "else if (spec.type === 'ELLIPSE') node = figma.createEllipse();",
    "else if (MG_CONNECTOR_ELLIPSE && spec.type === 'ELLIPSE') node = figma.createEllipse();"
  );
  replaceOnce(
    "if (spec.type === 'ELLIPSE')\n",
    "if (MG_CONNECTOR_ELLIPSE && spec.type === 'ELLIPSE')\n"
  );
  replaceOnce(
    'if (family.review?.preserveVariantSizing !== undefined) {',
    'if (MG_CONNECTOR_INTRINSIC_VALIDATION && family.review?.preserveVariantSizing !== undefined) {'
  );
  replaceOnce(
    'if (family.review?.variantSurfaces !== undefined) {',
    'if (MG_CONNECTOR_REVIEW_SURFACES && family.review?.variantSurfaces !== undefined) {'
  );
  replaceOnce(
    'if (specimen.surface !== undefined)',
    'if (MG_CONNECTOR_REVIEW_SURFACES && specimen.surface !== undefined)'
  );
  replaceOnce(
    'if (tree.textDecorationOffset !== undefined) {',
    'if (MG_CONNECTOR_TEXT_OFFSET && tree.textDecorationOffset !== undefined) {'
  );
  replaceOnce(
    'spec.textDecorationOffset !== undefined &&\n        node.textDecoration ===',
    'MG_CONNECTOR_TEXT_OFFSET && spec.textDecorationOffset !== undefined &&\n        node.textDecoration ==='
  );
  replaceOnce(
    'if (specimen.nodes !== undefined) {',
    'if (MG_CONNECTOR_REVIEW_NODES && specimen.nodes !== undefined) {'
  );
  replaceOnce(
    'if (specimen.nodes?.length && (fresh || refreshNarrowReview)) {',
    'if (MG_CONNECTOR_REVIEW_NODES && specimen.nodes?.length && (fresh || refreshNarrowReview)) {'
  );
  replaceOnce(
    'const surface =\n          specimen.surface ??\n          reviewOptions.variantSurfaces?.[specimen.variant.recipe.id];',
    'const surface = MG_CONNECTOR_REVIEW_SURFACES && (specimen.surface ?? reviewOptions.variantSurfaces?.[specimen.variant.recipe.id]);'
  );
  replaceOnce(
    'if (MG_DIRECT_TEXT_ENABLED) {',
    'if (MG_CONNECTOR_DIRECT_TEXT) {'
  );
  replaceOnce(
    'if (tree.focusRing) {',
    'if (MG_CONNECTOR_FOCUS && tree.focusRing) {'
  );
  // Keep the existing obsolete-outline cleanup even for an extension-free
  // embedded scope. Only the absent outline renderer is unreachable.
  replaceOnce(
    'if (!spec.focusRing) {',
    'if (!MG_CONNECTOR_FOCUS || !spec.focusRing) {'
  );
  // The source DTO is embedded self-contained, not supplied at execution time.
  // subsetDocument refuses unknown/missing source focus extensions before
  // compilation. Only that source-proven extension-free scope may omit this
  // additional desktop preflight; the enabled branch keeps every native guard.
  const focusStart =
    '  const coincidentFocus = MG_COINCIDENT_FOCUS_ENABLED ? new Map() : null;';
  const focusEnd = '  const svgPlans = new Map();';
  const start = source.indexOf(focusStart),
    end = source.indexOf(focusEnd);
  if (
    start < 0 ||
    end <= start ||
    source.indexOf(focusStart, start + 1) >= 0 ||
    source.indexOf(focusEnd, end + 1) >= 0
  )
    throw new Error(
      'Connector COINCIDENT_SCALE specialization boundary changed.'
    );
  const section = source.slice(start, end),
    tryStart = section.indexOf('  try {');
  if (tryStart < 0 || !section.endsWith('    return result;\n  }\n'))
    throw new Error('Connector COINCIDENT_SCALE preflight shape changed.');
  source =
    source.slice(0, start) +
    section.slice(0, tryStart) +
    '  if (MG_CONNECTOR_COINCIDENT_FOCUS) {\n' +
    section.slice(tryStart) +
    '  }\n' +
    source.slice(end);
  // When surfaces are absent, the existing else branch still clears/hides an
  // obsolete owned surface. Only new surface construction becomes unreachable.
  return source;
}
function connectorInspectionSummary(report, nodeIds) {
  const nodes = report.nodes;
  const brief = node => ({
    id: node.id,
    name: node.name,
    type: node.type,
    mgKitId: node.mgKitId,
    width: node.width,
    height: node.height,
    x: node.x,
    y: node.y,
    childCount:
      node.childIds?.length ?? node.childCount ?? node.variantIds?.length ?? 0,
  });
  const result = {
    schemaVersion: report.schemaVersion,
    capturedAt: report.capturedAt,
    document: report.document,
    currentPage: report.currentPage,
    counts: {
      variables: report.variables.length,
      textStyles: report.styles.text.length,
      effectStyles: report.styles.effect.length,
      nodes: nodes.length,
      components: nodes.filter(node => node.type === 'COMPONENT').length,
      instances: nodes.filter(node => node.type === 'INSTANCE').length,
    },
    collections: report.collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      modes: collection.modes,
      variableCount: collection.variableIds?.length,
    })),
    roots: nodes
      .filter(node => node.parentId === report.currentPage.id)
      .map(brief),
    sets: nodes
      .filter(node => node.type === 'COMPONENT_SET')
      .map(node => ({
        ...brief(node),
        variantIds: node.childIds,
        properties: node.componentPropertyDefinitions,
      })),
    selectedNodes: nodes
      .filter(node => nodeIds.includes(node.id))
      .map(node => ({
        ...brief(node),
        parentId: node.parentId,
        childIds: node.childIds,
        mainComponent: node.mainComponent,
        characters: node.characters,
        fontName: node.fontName,
        fontSize: node.fontSize,
        lineHeight: node.lineHeight,
        textStyleId: node.textStyleId,
        effectStyleId: node.effectStyleId,
        componentProperties: node.componentProperties,
        fills: node.fills,
        strokes: node.strokes,
        effects: node.effects,
        resolvedBindings: node.resolvedBindings,
      })),
    missingSelectedIds: nodeIds.filter(
      id => !nodes.some(node => node.id === id)
    ),
    fonts: report.fonts,
    errorCount: report.errors.length,
    errors: report.errors.slice(0, 20),
    detailOmitted: false,
  };
  // Keep JSON intact when even a selected node or property schema is unusually large.
  const size = () =>
    encodeURIComponent(JSON.stringify(result)).replace(/%[0-9A-F]{2}/g, 'x')
      .length;
  if (size() > 16000) {
    result.selectedNodes = result.selectedNodes.map(node => brief(node));
    result.detailOmitted = true;
  }
  if (size() > 16000) {
    result.sets = result.sets.map(set => ({
      ...brief(set),
      variantIds: set.variantIds,
    }));
    result.detailOmitted = true;
  }
  if (size() > 16000) {
    result.setCount = result.sets.length;
    result.sets = result.sets.slice(0, 12);
    result.roots = result.roots.slice(0, 12);
    result.errors = result.errors.map(error => String(error).slice(0, 200));
    result.detailOmitted = true;
  }
  if (size() > 16000) {
    result.sets = result.sets.map(set => ({
      id: set.id,
      name: String(set.name).slice(0, 200),
      variantCount: set.variantIds.length,
    }));
    result.selectedNodes = [];
    result.fonts = null;
    result.detailOmitted = true;
  }
  return result;
}
async function buildConnector({
  operation = 'build',
  brandId = 'undrr',
  familyIds,
  variantIds,
  variableIds,
  styleIds,
  nodeIds = [],
  checkFonts = false,
  doc,
} = {}) {
  if (!['build', 'import', 'diagnostics', 'inspect'].includes(operation))
    throw new Error(
      operation === 'export'
        ? 'Use the Figma screenshot tool for images; connector JSON image bytes exceed its response limit.'
        : `Unknown connector operation ${operation}`
    );
  if (
    !Array.isArray(nodeIds) ||
    nodeIds.length > 4 ||
    nodeIds.some(id => typeof id !== 'string')
  )
    throw new Error('Inspection accepts at most four node IDs.');
  doc =
    doc ||
    JSON.parse(
      fs.readFileSync(path.join(PLUGIN, 'mangrove-variables.json'), 'utf8')
    );
  const requested =
    familyIds ||
    (operation === 'build'
      ? (doc.components?.families || []).map(family => family.id)
      : []);
  if (operation === 'build' && !requested.length)
    throw new Error('No component recipes. Rebuild the token JSON.');
  if (
    variantIds !== undefined &&
    (operation !== 'build' ||
      requested.length !== 1 ||
      !Array.isArray(variantIds) ||
      !variantIds.length ||
      new Set(variantIds).size !== variantIds.length ||
      variantIds.some(id => typeof id !== 'string' || !id))
  )
    throw new Error(
      'Variant batches require one family and unique variant IDs.'
    );
  const scopedImport = variableIds !== undefined || styleIds !== undefined;
  if (
    scopedImport &&
    (operation !== 'import' ||
      [variableIds, styleIds].some(
        ids =>
          ids !== undefined &&
          (!Array.isArray(ids) ||
            new Set(ids).size !== ids.length ||
            ids.some(id => typeof id !== 'string' || !id.trim()))
      ) ||
      !(variableIds?.length || styleIds?.length))
  )
    throw new Error(
      'Import batches require unique variableIds/styleIds and at least one selected ID.'
    );
  const subset = subsetDocument(
    doc,
    operation,
    brandId,
    requested,
    variantIds,
    scopedImport ? { variableIds, styleIds } : undefined
  );
  const importScope = scopedImport
    ? {
        brandId,
        requestedVariableIds: variableIds || [],
        requestedStyleIds: styleIds || [],
        variableIds: subset.variables.map(spec => spec.id),
        styleIds: [...subset.styles.text, ...subset.styles.effect].map(
          spec => spec.id
        ),
        prune: false,
      }
    : null;
  const letterSpacingEnabled = retainedLetterSpacing(subset);
  // Compile the native SVG importer only when the exact dependency/variant
  // subset needs it. The desktop plugin keeps every capability available.
  function needsSvg(node) {
    return node.type === 'SVG' || (node.children || []).some(needsSvg);
  }
  const svgEnabled =
    operation === 'build' &&
    subset.components.families.some(family =>
      family.variants.some(variant => needsSvg(variant.tree))
    );
  function needsEllipse(node) {
    return node.type === 'ELLIPSE' || (node.children || []).some(needsEllipse);
  }
  const ellipseEnabled =
    operation === 'build' &&
    subset.components.families.some(family =>
      family.variants.some(variant => needsEllipse(variant.tree))
    );
  function needsAbsolute(node) {
    return (
      node.absolute !== undefined || (node.children || []).some(needsAbsolute)
    );
  }
  const absoluteEnabled =
    operation === 'build' &&
    subset.components.families.some(family =>
      family.variants.some(variant => needsAbsolute(variant.tree))
    );
  function needsArc(node) {
    return 'arcData' in node || (node.children || []).some(needsArc);
  }
  const arcEnabled =
    operation === 'build' &&
    subset.components.families.some(family =>
      family.variants.some(variant => needsArc(variant.tree))
    );
  const intrinsicReviewEnabled =
    operation === 'build' &&
    subset.components.families.some(
      family => family.review?.preserveVariantSizing
    );
  const intrinsicValidationEnabled =
    operation === 'build' &&
    subset.components.families.some(
      family => family.review?.preserveVariantSizing !== undefined
    );
  const reviewSurfacesEnabled =
    operation === 'build' &&
    subset.components.families.some(
      family =>
        family.review?.variantSurfaces !== undefined ||
        (Array.isArray(family.review?.specimens) &&
          family.review.specimens.some(
            specimen => specimen?.surface !== undefined
          ))
    );
  function needsTextOffset(node) {
    return (
      node.textDecorationOffset !== undefined ||
      (node.children || []).some(needsTextOffset)
    );
  }
  const textOffsetEnabled =
    operation === 'build' &&
    subset.components.families.some(family =>
      family.variants.some(variant => needsTextOffset(variant.tree))
    );
  function needsDirectText(node) {
    return (
      'textStyleApplication' in node ||
      (node.children || []).some(needsDirectText)
    );
  }
  const directTextEnabled =
    operation === 'build' &&
    subset.components.families.some(family =>
      family.variants.some(variant => needsDirectText(variant.tree))
    );
  function needsFocus(node) {
    return (
      node.focusRing !== undefined || (node.children || []).some(needsFocus)
    );
  }
  const focusEnabled =
    operation === 'build' &&
    subset.components.families.some(family =>
      family.variants.some(variant => needsFocus(variant.tree))
    );
  function needsCoincidentFocus(node) {
    return (
      node.focusRing?.renderer === 'COINCIDENT_SCALE' ||
      (node.children || []).some(needsCoincidentFocus)
    );
  }
  const coincidentFocusEnabled =
    operation === 'build' &&
    subset.components.families.some(family =>
      family.variants.some(variant => needsCoincidentFocus(variant.tree))
    );
  const reviewNodesEnabled =
    operation === 'build' &&
    subset.components.families.some(
      family =>
        Array.isArray(family.review?.specimens) &&
        family.review.specimens.some(specimen => specimen?.nodes !== undefined)
    );
  const needsMedia = tree =>
    tree.image !== undefined ||
    tree.gradient !== undefined ||
    (tree.children || []).some(needsMedia);
  const mediaEnabled =
    operation === 'build' &&
    subset.components.families.some(family =>
      family.variants.some(variant => needsMedia(variant.tree))
    );
  const needsFramePosition = tree =>
    (tree.type === 'FRAME' && tree.position !== undefined) ||
    (tree.children || []).some(needsFramePosition);
  const framePositionEnabled =
    operation === 'build' &&
    subset.components.families.some(family =>
      family.variants.some(variant => needsFramePosition(variant.tree))
    );
  let source = 'const MG_SHARED_ONLY = true;\n';
  source += fs.readFileSync(path.join(PLUGIN, 'kit-identity.js'), 'utf8');
  source += `\n;\n${specializeCore(coreSource())}\n;\n`;
  const runtime =
    operation === 'build'
      ? 'kit-builder.js'
      : ['diagnostics', 'inspect'].includes(operation)
        ? 'kit-inspection.js'
        : null;
  let packedDocument = subset;
  if (runtime) {
    const runtimeSource = fs.readFileSync(path.join(PLUGIN, runtime), 'utf8');
    if (svgEnabled)
      packedDocument = {
        ...subset,
        connectorSvgPlans: verifiedSvgPlans(subset, runtimeSource),
      };
    source +=
      (operation === 'build'
        ? specializeBuilder(runtimeSource, subset)
        : runtimeSource) + '\n;\n';
  }
  if (subset) {
    source += `const doc = (${decompressJSON.toString()})(${JSON.stringify(compressJSON(packedDocument))});\n`;
  }
  if (operation === 'build') {
    const invocation = `await buildMangroveComponents(doc, ${JSON.stringify(brandId)}, ${JSON.stringify(requested)})`;
    source += variantIds
      ? `const result = ${invocation}; return {...result, scope: ${JSON.stringify({ familyIds: requested, variantIds })}};`
      : `return ${invocation};`;
  } else if (operation === 'import')
    source += `
      const {createdVariableIds, updatedVariableIds, removedVariableIds, styles, ...result} = await importVariables(doc, [${JSON.stringify(brandId)}], false, ${JSON.stringify(subset.styles.text.map(spec => spec.id))}, true);
      const {createdStyleIds, updatedStyleIds, touchedStyleIds, removedStyleIds, retainedPartialStyleIds, ...styleReport} = styles;
      result.styles = styleReport;
      return {result, createdVariableIds, updatedVariableIds, removedVariableIds, createdStyleIds, updatedStyleIds, touchedStyleIds, removedStyleIds, retainedPartialStyleIds${importScope ? `, scope: ${JSON.stringify(importScope)}` : ''}};
    `;
  else if (operation === 'diagnostics')
    source += `return await createMangroveFocusDiagnostics(doc, ${JSON.stringify(brandId)});`;
  else if (operation === 'inspect')
    source += `return (${connectorInspectionSummary.toString()})(await inspectMangroveKit({checkFonts:${Boolean(checkFonts)}}), ${JSON.stringify(nodeIds)});`;
  const minified = await minify(`async function mgRun(){${source}}`, {
    compress: {
      passes: 3,
      global_defs: {
        MG_CONNECTOR_FRAME_POSITION: framePositionEnabled,
        MG_CONNECTOR_LETTER_SPACING: letterSpacingEnabled,
        MG_CONNECTOR_MEDIA: mediaEnabled,
        MG_CONNECTOR_SVG: svgEnabled,
        MG_CONNECTOR_ELLIPSE: ellipseEnabled,
        MG_CONNECTOR_ABSOLUTE: absoluteEnabled,
        MG_CONNECTOR_ARC: arcEnabled,
        MG_CONNECTOR_INTRINSIC_REVIEW: intrinsicReviewEnabled,
        MG_CONNECTOR_INTRINSIC_VALIDATION: intrinsicValidationEnabled,
        MG_CONNECTOR_REVIEW_SURFACES: reviewSurfacesEnabled,
        MG_CONNECTOR_TEXT_OFFSET: textOffsetEnabled,
        MG_CONNECTOR_REVIEW_NODES: reviewNodesEnabled,
        MG_CONNECTOR_DIRECT_TEXT: directTextEnabled,
        MG_CONNECTOR_FOCUS: focusEnabled,
        MG_CONNECTOR_COINCIDENT_FOCUS: coincidentFocusEnabled,
      },
    },
    mangle: true,
    format: { comments: false },
  });
  const wrapped = minified.code;
  const header = 'async function mgRun(){';
  if (!wrapped?.startsWith(header) || !wrapped.endsWith('}'))
    throw new Error('Unexpected minifier wrapper output.');
  const code = wrapped.slice(header.length, -1);
  const bytes = Buffer.byteLength(code, 'utf8');
  if (code.length > LIMIT || bytes > LIMIT)
    throw new Error(
      `Connector payload exceeds ${LIMIT}: ${code.length} characters / ${bytes} bytes. ${
        operation === 'build'
          ? 'Select fewer families, or batch one family with explicit variantIds (CLI fourth argument: comma-separated recipe variant IDs).'
          : operation === 'import'
            ? 'Import explicit variableIds/styleIds batches (CLI --variables=id,id --styles=id,id). Each batch includes alias and style-binding dependencies with pruning off; reduce the requested IDs if needed. No metadata was truncated.'
            : 'Use the desktop plugin for this operation; no metadata was truncated.'
      }`
    );
  return {
    code,
    operation,
    brandId,
    families: operation === 'build' ? requested : [],
    variantIds: variantIds || null,
    scope: importScope,
    svgEnabled,
    ellipseEnabled,
    directTextEnabled,
    coincidentFocusEnabled,
    letterSpacingEnabled,
    focusEnabled,
    characters: code.length,
    bytes,
  };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  const positional = args.filter(arg => !arg.startsWith('--'));
  const [operation = 'build', brandId = 'undrr', familyList, variantList] =
    positional;
  const flags = {};
  let cliError;
  for (const arg of args.filter(arg => arg.startsWith('--'))) {
    const match = /^--(variables|styles)=(.*)$/.exec(arg);
    if (!match || flags[match[1]] !== undefined)
      cliError = `Unknown or duplicate connector option ${arg}`;
    else flags[match[1]] = match[2] ? match[2].split(',') : [];
  }
  (cliError
    ? Promise.reject(new Error(cliError))
    : buildConnector({
        operation,
        brandId,
        familyIds: familyList ? familyList.split(',') : undefined,
        variantIds: variantList ? variantList.split(',') : undefined,
        variableIds: flags.variables,
        styleIds: flags.styles,
        nodeIds:
          operation === 'inspect' && familyList ? familyList.split(',') : [],
      })
  )
    .then(result => {
      process.stdout.write(`${result.code}\n`);
      process.stderr.write(
        `build-figma-connector: ${result.operation} / ${result.brandId}, ${result.characters} characters / ${result.bytes} bytes${result.variantIds ? `, variants: ${result.variantIds.join(',')}` : ''}${result.scope ? `, requested: ${result.scope.requestedVariableIds.length} variables / ${result.scope.requestedStyleIds.length} styles, dependency closure: ${result.scope.variableIds.length} variables / ${result.scope.styleIds.length} styles, pruning off` : ''}\n`
      );
    })
    .catch(error => {
      process.stderr.write(`build-figma-connector: ${error.message}\n`);
      process.exitCode = 1;
    });
}
module.exports = {
  buildConnector,
  subsetDocument,
  compressJSON,
  decompressJSON,
  connectorInspectionSummary,
};
