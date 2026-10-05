/** Rich TEXT capability with transaction preflight and native ownership guards. */
/* global module, MG_CONNECTOR_RICH_DTO_VALIDATION */
'use strict';
const mgRichText = (() => {
  const checkDTO =
    typeof MG_CONNECTOR_RICH_DTO_VALIDATION === 'undefined' ||
    MG_CONNECTOR_RICH_DTO_VALIDATION;
  const plans = new WeakMap();
  const fields = [
    'textStyleId',
    'fontName',
    'fills',
    'hyperlink',
    'textDecoration',
  ];
  const copy = value => JSON.parse(JSON.stringify(value));
  const fail = message => {
    throw new Error(`Rich text: ${message}`);
  };
  const object = value =>
    value && typeof value === 'object' && !Array.isArray(value);
  const boundary = (text, offset) =>
    !(
      offset > 0 &&
      offset < text.length &&
      /[\uD800-\uDBFF]/.test(text[offset - 1]) &&
      /[\uDC00-\uDFFF]/.test(text[offset])
    );
  const fontValid = font =>
    object(font) &&
    typeof font.family === 'string' &&
    font.family.length &&
    typeof font.style === 'string' &&
    font.style.length &&
    Object.keys(font).every(key =>
      ['family', 'style', 'variationSettings'].includes(key)
    ) &&
    (font.variationSettings === undefined ||
      (object(font.variationSettings) &&
        Object.keys(font.variationSettings).length > 0 &&
        Object.entries(font.variationSettings).every(
          ([axis, value]) =>
            /^[\x20-\x7E]{4}$/.test(axis) && Number.isFinite(value)
        )));
  function normalizedFont(font) {
    if (!fontValid(font)) fail('unsupported run font.');
    return {
      family: font.family,
      style: font.style,
      ...(font.variationSettings === undefined
        ? {}
        : {
            variationSettings: Object.fromEntries(
              Object.entries(font.variationSettings).sort(([a], [b]) =>
                a.localeCompare(b)
              )
            ),
          }),
    };
  }
  function resolveFontInput(font, inventory, nativeAxes) {
    const input = normalizedFont(font);
    if (!Array.isArray(inventory))
      fail('native named-font inventory is missing.');
    const matches = inventory
      .filter(
        entry =>
          entry?.fontName?.family === input.family &&
          entry.fontName.style === input.style
      )
      .map(entry => normalizedFont(entry.fontName));
    if (
      !matches.length ||
      new Set(matches.map(value => JSON.stringify(value))).size !== 1
    )
      fail('native named-font inventory is missing or ambiguous.');
    const native = matches[0];
    if (nativeAxes !== undefined) {
      if (
        nativeAxes !== null &&
        (!Array.isArray(nativeAxes) ||
          !nativeAxes.length ||
          new Set(nativeAxes).size !== nativeAxes.length ||
          nativeAxes.some(
            axis => typeof axis !== 'string' || !/^[\x20-\x7E]{4}$/.test(axis)
          ))
      )
        fail('native font axis inventory is invalid.');
      const expected = nativeAxes === null ? [] : [...nativeAxes].sort();
      if (
        JSON.stringify(Object.keys(native.variationSettings ?? {}).sort()) !==
        JSON.stringify(expected)
      )
        fail(
          'native named-instance default axes are unresolved; separate supported probe required.'
        );
    }
    if (
      input.variationSettings &&
      Object.entries(input.variationSettings).some(
        ([axis, value]) => native.variationSettings?.[axis] !== value
      )
    )
      fail('source font axes disagree with native named-instance defaults.');
    return native;
  }
  function dependencyStamp(ctx, items) {
    return JSON.stringify(
      items.map(item => {
        const style = ctx.resolveStyle(item.styleKey),
          color = ctx.resolveColor(item.colorKey);
        // Native API objects need explicit field reads; JSON enumeration is not a contract.
        return [
          style?.key,
          style?.pending ?? false,
          style?.style?.type,
          style?.style?.id,
          style?.style?.fontName ? normalizedFont(style.style.fontName) : null,
          color?.key,
          color?.variable?.id,
          color?.variable?.resolvedType,
          color?.values,
        ];
      })
    );
  }
  function signature(segment) {
    const fills = segment.fills;
    if (
      !Array.isArray(fills) ||
      fills.length !== 1 ||
      fills[0].type !== 'SOLID' ||
      fills[0].opacity !== 1 ||
      fills[0].visible === false ||
      fills[0].boundVariables?.color?.type !== 'VARIABLE_ALIAS' ||
      typeof fills[0].boundVariables.color.id !== 'string'
    )
      fail('unowned or unsupported run paint.');
    if (!fontValid(segment.fontName)) fail('unsupported run font.');
    if (typeof segment.textStyleId !== 'string' || !segment.textStyleId)
      fail('run style identity is missing.');
    const link = segment.hyperlink ?? null;
    if (
      link !== null &&
      (!object(link) || link.type !== 'URL' || typeof link.value !== 'string')
    )
      fail('unsupported native hyperlink.');
    return JSON.stringify([
      segment.textStyleId,
      segment.fontName.family,
      segment.fontName.style,
      fills[0].boundVariables.color.id,
      segment.textDecoration,
      link?.value ?? null,
      normalizedFont(segment.fontName).variationSettings ?? null,
    ]);
  }
  function segments(node) {
    if (!node.characters.length) return [];
    const source = node.getStyledTextSegments(fields);
    const result = [];
    let end = 0;
    for (const item of source) {
      if (
        item.start !== end ||
        !Number.isInteger(item.end) ||
        item.end <= item.start ||
        item.end > node.characters.length ||
        !boundary(node.characters, item.start) ||
        !boundary(node.characters, item.end)
      )
        fail('native segment boundaries are invalid.');
      const sig = signature(item);
      const previous = result[result.length - 1];
      if (previous?.signature === sig) previous.end = item.end;
      else
        result.push({
          start: item.start,
          end: item.end,
          signature: sig,
          fontName: normalizedFont(item.fontName),
        });
      end = item.end;
    }
    if (end !== node.characters.length)
      fail('native segments must cover all current characters.');
    return result;
  }
  function snapshot(node, ctx) {
    if (!node) return null;
    if (node.type !== 'TEXT' || node.removed || node.hasMissingFont)
      fail('existing target must be a live TEXT with available fonts.');
    if (node.componentPropertyReferences?.characters)
      fail('whole-string component property resets are unsupported.');
    return {
      id: node.id,
      characters: node.characters,
      ledger: ctx.readState(node),
      segments: segments(node),
    };
  }
  function decodeLedger(value) {
    let ledger;
    try {
      ledger = typeof value === 'string' ? JSON.parse(value) : null;
    } catch {
      fail('invalid ownership ledger.');
    }
    if (
      !object(ledger) ||
      ledger.version !== 1 ||
      typeof ledger.identity !== 'string' ||
      typeof ledger.sourceCharacters !== 'string' ||
      !Array.isArray(ledger.runs) ||
      !ledger.runs.length ||
      ledger.runs.some(
        run =>
          !object(run) ||
          typeof run.id !== 'string' ||
          typeof run.signature !== 'string'
      )
    )
      fail('missing or invalid ownership ledger; explicit migration required.');
    return ledger;
  }
  async function prepare(spec, ctx, node = null) {
    if (
      !object(ctx) ||
      !ctx.figma ||
      typeof ctx.resolveStyle !== 'function' ||
      typeof ctx.resolveColor !== 'function' ||
      typeof ctx.readState !== 'function' ||
      typeof ctx.writeState !== 'function' ||
      typeof ctx.figma.loadFontAsync !== 'function' ||
      typeof ctx.figma.variables?.setBoundVariableForPaint !== 'function' ||
      !Array.isArray(ctx.modeIds) ||
      !ctx.modeIds.length ||
      new Set(ctx.modeIds).size !== ctx.modeIds.length ||
      ctx.modeIds.some(id => typeof id !== 'string' || !id)
    )
      fail('incomplete capability context.');
    if (
      checkDTO &&
      (!object(spec) ||
        Object.keys(spec).some(
          key =>
            ![
              'id',
              'key',
              'name',
              'type',
              'characters',
              'textRuns',
              'layout',
              'textWrap',
              'textAlign',
              'position',
              'absolute',
            ].includes(key)
        ) ||
        spec.type !== 'TEXT' ||
        typeof spec.id !== 'string' ||
        !spec.id ||
        typeof spec.characters !== 'string' ||
        !spec.characters.length ||
        spec.characters.length > 32768 ||
        !Array.isArray(spec.textRuns) ||
        !spec.textRuns.length ||
        spec.textRuns.length > 128 ||
        spec.textProperty !== undefined ||
        spec.textStyle !== undefined ||
        spec.fill !== undefined ||
        spec.textStyleApplication !== undefined ||
        spec.textDecoration !== undefined ||
        spec.textDecorationOffset !== undefined)
    )
      fail(
        'requires bounded TEXT characters, stable id and textRuns without whole-node style/property overrides.'
      );
    const ids = new Set();
    const prepared = [];
    let end = 0;
    for (const run of spec.textRuns) {
      if (
        checkDTO &&
        (!object(run) ||
          Object.keys(run).some(
            key =>
              ![
                'id',
                'start',
                'end',
                'textStyle',
                'fill',
                'hyperlink',
                'textDecoration',
              ].includes(key)
          ) ||
          typeof run.id !== 'string' ||
          !run.id ||
          ids.has(run.id) ||
          run.start !== end ||
          !Number.isInteger(run.start) ||
          !Number.isInteger(run.end) ||
          run.end <= run.start ||
          run.end > spec.characters.length ||
          !boundary(spec.characters, run.start) ||
          !boundary(spec.characters, run.end) ||
          typeof run.textStyle !== 'string' ||
          !run.textStyle ||
          typeof run.fill !== 'string' ||
          !run.fill)
      )
        fail(
          'runs need unique ids, complete non-overlapping UTF-16 ranges and named style/paint roles.'
        );
      ids.add(run.id);
      end = run.end;
      const decoration = run.textDecoration ?? 'NONE';
      if (checkDTO && !['NONE', 'UNDERLINE'].includes(decoration))
        fail('unsupported run decoration.');
      const link = run.hyperlink ?? null;
      if (
        checkDTO &&
        link !== null &&
        (!object(link) ||
          Object.keys(link).some(key => !['type', 'value'].includes(key)) ||
          link.type !== 'URL' ||
          typeof link.value !== 'string' ||
          !/^https:\/\/[^\s]+$/.test(link.value))
      )
        fail('links require explicit HTTPS URL targets.');
      const style = ctx.resolveStyle(run.textStyle);
      if (
        !object(style) ||
        style.key !== run.textStyle ||
        style.style?.type !== 'TEXT' ||
        ((typeof style.style.id !== 'string' || !style.style.id) &&
          !(
            ctx.deferredStyles === true &&
            style.pending === true &&
            style.style.id === null
          )) ||
        !fontValid(style.style.fontName)
      )
        fail(`missing or wrong text style ${run.textStyle}.`);
      const color = ctx.resolveColor(run.fill);
      if (
        !object(color) ||
        color.key !== run.fill ||
        color.variable?.resolvedType !== 'COLOR' ||
        typeof color.variable.id !== 'string' ||
        !color.variable.id ||
        !object(color.values)
      )
        fail(`missing or wrong COLOR role ${run.fill}.`);
      for (const mode of ctx.modeIds) {
        const value = color.values[mode];
        if (
          !object(value) ||
          !['r', 'g', 'b'].every(
            key =>
              Number.isFinite(value[key]) && value[key] >= 0 && value[key] <= 1
          ) ||
          (value.a !== undefined && value.a !== 1)
        )
          fail(`unresolved or invalid COLOR ${run.fill} in mode ${mode}.`);
      }
      const value = color.values[ctx.modeIds[0]];
      const paint = ctx.figma.variables.setBoundVariableForPaint(
        {
          type: 'SOLID',
          color: { r: value.r, g: value.g, b: value.b },
          opacity: 1,
          visible: true,
        },
        'color',
        color.variable
      );
      const item = {
        id: run.id,
        start: run.start,
        end: run.end,
        textStyleId: style.style.id,
        fontName: normalizedFont(style.style.fontName),
        fills: [paint],
        hyperlink: copy(link),
        textDecoration: decoration,
      };
      item.styleKey = run.textStyle;
      item.colorKey = run.fill;
      item.signature = item.textStyleId
        ? signature(item)
        : JSON.stringify([
            'pending-source-style',
            run.textStyle,
            item.fontName,
            run.fill,
            decoration,
            link,
          ]);
      if (prepared[prepared.length - 1]?.signature === item.signature)
        fail('adjacent indistinguishable runs must be one authored run.');
      prepared.push(item);
    }
    if (checkDTO && end !== spec.characters.length)
      fail('runs must cover all characters.');
    const before = snapshot(node, ctx);
    let ranges = prepared.map(item => ({ start: item.start, end: item.end }));
    let preserve = false;
    if (before) {
      const ledger = decodeLedger(before.ledger);
      if (
        ledger.identity !== spec.id ||
        ledger.runs.length !== before.segments.length ||
        ledger.runs.length !== prepared.length ||
        ledger.runs.some(
          (run, index) =>
            run.id !== prepared[index].id ||
            run.signature !== before.segments[index].signature
        )
      )
        fail(
          'run ownership changed, merged or removed; explicit migration required.'
        );
      preserve = before.characters !== ledger.sourceCharacters;
      if (preserve)
        ranges = before.segments.map(item => ({
          start: item.start,
          end: item.end,
        }));
    }
    const fonts = new Map();
    for (const item of [...prepared, ...(before?.segments || [])])
      fonts.set(JSON.stringify(item.fontName), item.fontName);
    // Fresh TEXT starts in the host's default font; integration must supply it.
    if (!before) {
      if (!fontValid(ctx.creationFont))
        fail('fresh target requires the host creation font.');
      fonts.set(JSON.stringify(ctx.creationFont), ctx.creationFont);
    }
    const currentDependencies = () => dependencyStamp(ctx, prepared);
    const dependencies = currentDependencies();
    for (const font of fonts.values()) await ctx.figma.loadFontAsync(font);
    if (currentDependencies() !== dependencies)
      fail('dependencies changed during font preflight.');
    if (JSON.stringify(snapshot(node, ctx)) !== JSON.stringify(before))
      fail('target changed during preflight.');
    const handle = Object.freeze({
      identity: spec.id,
      runCount: prepared.length,
      preservedEdits: preserve,
    });
    plans.set(handle, {
      ctx,
      node,
      before,
      prepared,
      ranges,
      preserve,
      characters: spec.characters,
      identity: spec.id,
      dependencyStamp: currentDependencies,
      dependencies,
      finalized: ctx.deferredStyles !== true,
    });
    return handle;
  }
  async function apply(handle, node) {
    const plan = plans.get(handle);
    if (!plan) fail('unknown or consumed preflight plan.');
    const { ctx, before, prepared, ranges, preserve, characters, identity } =
      plan;
    if (!plan.finalized)
      fail('deferred style plan must be finalized after import.');
    if (plan.dependencyStamp() !== plan.dependencies)
      fail('dependencies changed after preflight.');
    if (
      !node ||
      node.type !== 'TEXT' ||
      node.removed ||
      node.componentPropertyReferences?.characters ||
      ![
        'setRangeTextStyleIdAsync',
        'setRangeFills',
        'setRangeTextDecoration',
        'setRangeHyperlink',
      ].every(name => typeof node[name] === 'function')
    )
      fail('invalid target or unsafe component property.');
    if (before) {
      if (
        node !== plan.node ||
        JSON.stringify(snapshot(node, ctx)) !== JSON.stringify(before)
      )
        fail('target changed after preflight.');
    } else if (
      node.characters !== '' ||
      ctx.readState(node) ||
      !fontValid(node.fontName) ||
      JSON.stringify(normalizedFont(node.fontName)) !==
        JSON.stringify(normalizedFont(ctx.creationFont))
    )
      fail(
        'fresh target must be an empty unowned TEXT in the preloaded creation font.'
      );
    plans.delete(handle);
    if (!preserve && node.characters !== characters)
      node.characters = characters;
    for (let index = 0; index < prepared.length; index++) {
      const item = prepared[index],
        range = ranges[index];
      await node.setRangeTextStyleIdAsync(
        range.start,
        range.end,
        item.textStyleId
      );
      node.setRangeFills(range.start, range.end, item.fills);
      node.setRangeTextDecoration(range.start, range.end, item.textDecoration);
      node.setRangeHyperlink(range.start, range.end, item.hyperlink);
    }
    ctx.writeState(
      node,
      JSON.stringify({
        version: 1,
        identity,
        sourceCharacters: preserve
          ? JSON.parse(before.ledger).sourceCharacters
          : characters,
        runs: prepared.map(item => ({
          id: item.id,
          signature: item.signature,
        })),
      })
    );
    return {
      nodeId: node.id,
      runCount: prepared.length,
      preservedEdits: preserve,
    };
  }
  function finalize(handle, ctx) {
    const plan = plans.get(handle);
    if (!plan || plan.finalized || plan.ctx.deferredStyles !== true)
      fail('unknown or non-deferred plan.');
    if (plan.dependencyStamp() !== plan.dependencies)
      fail('projected dependencies changed during import.');
    if (
      typeof ctx.resolveStyle !== 'function' ||
      typeof ctx.resolveColor !== 'function' ||
      ctx.figma !== plan.ctx.figma ||
      ctx.readState !== plan.ctx.readState ||
      ctx.writeState !== plan.ctx.writeState ||
      JSON.stringify(ctx.modeIds) !== JSON.stringify(plan.ctx.modeIds) ||
      JSON.stringify(normalizedFont(ctx.creationFont)) !==
        JSON.stringify(normalizedFont(plan.ctx.creationFont))
    )
      fail('finalization context changed.');
    const current = snapshot(plan.node, ctx);
    if (plan.before) {
      const before = plan.before;
      if (
        current.id !== before.id ||
        current.characters !== before.characters ||
        current.ledger !== before.ledger ||
        current.segments.length !== before.segments.length
      )
        fail('target changed during style import.');
      for (let i = 0; i < current.segments.length; i++) {
        const now = current.segments[i],
          prior = before.segments[i],
          desired = plan.prepared[i];
        const expected = JSON.parse(prior.signature);
        expected[1] = desired.fontName.family;
        expected[2] = desired.fontName.style;
        expected[6] = desired.fontName.variationSettings ?? null;
        if (
          now.start !== prior.start ||
          now.end !== prior.end ||
          (now.signature !== prior.signature &&
            now.signature !== JSON.stringify(expected))
        )
          fail('unexpected range change during style import.');
      }
    }
    const native = plan.prepared.map(item => {
      const style = ctx.resolveStyle(item.styleKey),
        color = ctx.resolveColor(item.colorKey);
      if (
        !style ||
        style.key !== item.styleKey ||
        style.pending ||
        style.style?.type !== 'TEXT' ||
        typeof style.style.id !== 'string' ||
        !style.style.id ||
        JSON.stringify(normalizedFont(style.style.fontName)) !==
          JSON.stringify(item.fontName) ||
        (item.textStyleId !== null && item.textStyleId !== style.style.id)
      )
        fail('unexpected imported style identity/font.');
      if (
        !color ||
        color.key !== item.colorKey ||
        color.variable?.resolvedType !== 'COLOR' ||
        color.variable.id !== item.fills[0].boundVariables.color.id ||
        JSON.stringify(color.values) !==
          JSON.stringify(plan.ctx.resolveColor(item.colorKey).values)
      )
        fail('paint dependency changed during import.');
      const result = { ...item, textStyleId: style.style.id };
      result.signature = signature(result);
      return result;
    });
    plan.ctx = ctx;
    plan.prepared = native;
    plan.before = current;
    plan.dependencyStamp = () => dependencyStamp(ctx, native);
    plan.dependencies = plan.dependencyStamp();
    plan.finalized = true;
    return handle;
  }
  return Object.freeze({ prepare, finalize, apply, resolveFontInput });
})();
if (typeof module !== 'undefined') module.exports = mgRichText;
