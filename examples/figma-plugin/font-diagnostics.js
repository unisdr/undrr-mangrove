/* global figma */
/**
 * Optional loading diagnostic. Caller supplies an already-read font inventory.
 * No nodes, styles, variables or font assignments are created or changed.
 * Figma caches successful loadFontAsync calls; this changes font availability
 * in the plugin session only. No family-only loads or explicit network requests
 * are made; Figma manages the loading of its fonts.
 */
async function mgDiagnoseFontLoading(doc, { brandId, availableFonts } = {}) {
  const roles = ['font-family/ui', 'font-family/display'];
  const copy = value => JSON.parse(JSON.stringify(value));
  const message = error =>
    typeof error === 'string' ? error : error?.message || String(error);
  const validName = name =>
    name &&
    typeof name.family === 'string' &&
    name.family.length > 0 &&
    typeof name.style === 'string' &&
    name.style.length > 0 &&
    (name.variationSettings === undefined ||
      (name.variationSettings &&
        typeof name.variationSettings === 'object' &&
        !Array.isArray(name.variationSettings) &&
        Object.values(name.variationSettings).every(Number.isFinite)));
  const key = name =>
    JSON.stringify([
      name.family,
      name.style,
      Object.entries(name.variationSettings || {}).sort(([a], [b]) =>
        a.localeCompare(b)
      ),
    ]);
  const displayLabel = name => `${name.family} ${name.style}`;
  const metadata = name => ({
    fontName: copy(name),
    variationSettings: name.variationSettings
      ? copy(name.variationSettings)
      : null,
    widthAxisValue: name.variationSettings?.wdth ?? null,
    axisValuesSource: name.variationSettings ? 'provided-fontName' : null,
  });
  const report = {
    version: 1,
    kind: 'font-loading-diagnostic',
    brandId,
    roleBindings: roles,
    requested: [],
    candidates: [],
    families: [],
    loads: [],
    errors: [],
    identity: {
      confirmed: false,
      comparison: 'Matching display labels are naming candidates only.',
      unavailableMetadata: [
        'selected font file path',
        'font file version',
        'PostScript name',
        'font binary checksum',
        'variation axis ranges and named instance values',
      ],
      renderingChecked: false,
      note: 'loadFontAsync ignores variationSettings. Unknown width values are not evidence of normal width. No font was assigned.',
    },
    createdNodeIds: [],
    updatedNodeIds: [],
    mutatedNodeIds: [],
  };
  if (!doc?.modes?.some(mode => mode.id === brandId))
    report.errors.push(`Unknown source brand: ${brandId}`);
  if (!Array.isArray(availableFonts))
    report.errors.push('An already-read availableFonts inventory is required.');
  if (!Array.isArray(doc?.styles?.text))
    report.errors.push('Source text style definitions are required.');
  if (report.errors.length) return report;

  const requested = new Map();
  for (const style of doc.styles.text) {
    if (
      !(style.recommended || style.component) ||
      !roles.includes(style.bindings?.fontFamily)
    )
      continue;
    const fontName = style.values?.[brandId]?.fontName;
    if (!validName(fontName)) {
      report.errors.push(`Invalid source fontName for style ${style.id}.`);
      continue;
    }
    const id = key(fontName);
    if (!requested.has(id))
      requested.set(id, {
        ...metadata(fontName),
        sourceStyleIds: [],
        fontFamilyBindings: [],
      });
    const item = requested.get(id);
    if (!item.sourceStyleIds.includes(style.id))
      item.sourceStyleIds.push(style.id);
    if (!item.fontFamilyBindings.includes(style.bindings.fontFamily))
      item.fontFamilyBindings.push(style.bindings.fontFamily);
  }
  if (requested.size === 0 || requested.size > 2)
    report.errors.push(
      `Expected one or two source faces for the selected roles; found ${requested.size}. No fonts were probed.`
    );
  if (report.errors.length) return report;

  const inventory = new Map();
  for (const entry of availableFonts) {
    if (!validName(entry?.fontName)) {
      report.errors.push('Invalid fontName in the supplied font inventory.');
      continue;
    }
    inventory.set(key(entry.fontName), entry.fontName);
  }
  // Invalid inventory must not turn a missing or malformed name into a guess.
  if (report.errors.length) return report;
  for (const item of requested.values()) {
    const listed = [...inventory.values()].filter(
      name =>
        name.family === item.fontName.family &&
        name.style === item.fontName.style
    );
    const requestedItem = {
      ...item,
      listed: listed.length > 0,
      listedFontNames: listed.map(copy),
    };
    report.requested.push(requestedItem);
    const candidates = [...inventory.values()].filter(
      name =>
        displayLabel(name) === displayLabel(item.fontName) &&
        (name.family !== item.fontName.family ||
          name.style !== item.fontName.style)
    );
    if (candidates.length > 1) {
      report.errors.push(
        `Ambiguous listed alternative for ${displayLabel(item.fontName)}; ${candidates.length} names or variation configurations match. No alternative was probed.`
      );
    } else if (candidates.length === 1) {
      report.candidates.push({
        ...metadata(candidates[0]),
        requestedFontName: copy(item.fontName),
        matchRule: 'identical concatenated family/style display label',
        identityConfirmed: false,
        listed: true,
      });
    }
  }

  const probes = [
    ...report.requested.map(item => ({ kind: 'requested', ...item })),
    ...report.candidates.map(item => ({ kind: 'listed-candidate', ...item })),
  ];
  const families = [...new Set(probes.map(item => item.fontName.family))];
  for (const family of families) {
    const entry = { family, axes: null, checked: false };
    if (typeof figma.getFontFamilyVariationAxes === 'function') {
      try {
        // This API is synchronous; null identifies a static family.
        entry.axes = copy(figma.getFontFamilyVariationAxes(family));
        entry.checked = true;
      } catch (error) {
        entry.error = message(error);
      }
    } else {
      entry.error = 'getFontFamilyVariationAxes is unavailable.';
    }
    report.families.push(entry);
  }
  for (const item of probes) {
    const entry = {
      kind: item.kind,
      ...metadata(item.fontName),
      listed: item.listed,
      loaded: false,
    };
    try {
      await figma.loadFontAsync(copy(item.fontName));
      entry.loaded = true;
    } catch (error) {
      entry.error = message(error);
    }
    report.loads.push(entry);
  }
  return report;
}
