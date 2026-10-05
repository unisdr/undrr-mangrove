/* global mgRichText, module */
/** Guarded operation-local preparation. Probe writes are separate from pure preflight. */
async function mgResolveNamedFontDefaults(figmaApi, inputs, assertTarget) {
  const report = {
    operation: 'named-font-default-preparation',
    createdNodeIds: [],
    removedNodeIds: [],
    residualNodeIds: [],
    unverifiedRemovalNodeIds: [],
    verificationScope:
      'Recorded root children, node identity/parent/geometry/visibility/opacity/modes and TEXT ranges; recorded local typography/effect and variable/collection definitions. This does not assert every native property or consumer link.',
    resolvedFonts: [],
    errors: [],
    recordedSceneExact: false,
    recordedAssetsExact: false,
  };
  const page = figmaApi.currentPage;
  const fail = message => {
    throw new Error(`Font preparation: ${message}`);
  };
  const guard = () => {
    if (typeof assertTarget !== 'function')
      fail('trusted operation target hook is missing.');
    assertTarget();
    if (!page || page.removed || figmaApi.currentPage !== page)
      fail('operation page changed.');
  };
  const stable = value => {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map(key => [key, stable(value[key])])
      );
    return value;
  };
  const encode = value => JSON.stringify(stable(value));
  function scene() {
    return encode({
      rootChildren: page.children.map(node => node.id),
      nodes: page
        .findAll(() => true)
        .map(node => ({
          id: node.id,
          type: node.type,
          parent: node.parent?.id,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          rotation: node.rotation,
          visible: node.visible,
          opacity: node.opacity,
          explicitVariableModes: node.explicitVariableModes,
          ...(node.type === 'TEXT'
            ? {
                characters: node.characters,
                segments: node.characters.length
                  ? node.getStyledTextSegments([
                      'textStyleId',
                      'fontName',
                      'fills',
                      'hyperlink',
                      'textDecoration',
                    ])
                  : [],
                references: node.componentPropertyReferences,
              }
            : {}),
        })),
    });
  }
  async function assets() {
    const text = await figmaApi.getLocalTextStylesAsync();
    guard();
    const effects = await figmaApi.getLocalEffectStylesAsync();
    guard();
    const collections =
      await figmaApi.variables.getLocalVariableCollectionsAsync();
    guard();
    const variables = await figmaApi.variables.getLocalVariablesAsync();
    guard();
    return encode({
      text: text.map(style => ({
        id: style.id,
        name: style.name,
        fontName: style.fontName,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        boundVariables: style.boundVariables,
        textWrapStyle: style.textWrapStyle,
      })),
      effects: effects.map(style => ({
        id: style.id,
        name: style.name,
        effects: style.effects,
      })),
      collections: collections.map(item => ({
        id: item.id,
        name: item.name,
        modes: item.modes,
        defaultModeId: item.defaultModeId,
      })),
      variables: variables.map(item => ({
        id: item.id,
        name: item.name,
        resolvedType: item.resolvedType,
        variableCollectionId: item.variableCollectionId,
        valuesByMode: item.valuesByMode,
        scopes: item.scopes,
        description: item.description,
        hiddenFromPublishing: item.hiddenFromPublishing,
        codeSyntax: item.codeSyntax,
      })),
    });
  }
  let beforeScene, beforeAssets;
  const probes = [];
  try {
    guard();
    if (
      !Array.isArray(inputs) ||
      !inputs.length ||
      typeof mgRichText === 'undefined' ||
      typeof mgRichText.resolveFontInput !== 'function' ||
      typeof figmaApi.getFontFamilyVariationAxes !== 'function' ||
      typeof figmaApi.getNodeByIdAsync !== 'function'
    )
      fail('incomplete resolver context.');
    const fonts = new Map();
    for (const input of inputs) {
      if (
        !input ||
        typeof input.family !== 'string' ||
        !input.family ||
        typeof input.style !== 'string' ||
        !input.style ||
        Object.keys(input).some(
          key => !['family', 'style', 'variationSettings'].includes(key)
        )
      )
        fail('explicit named font inputs are required.');
      mgRichText.resolveFontInput(input, [{ fontName: input }]);
      fonts.set(encode({ family: input.family, style: input.style }), {
        family: input.family,
        style: input.style,
      });
    }
    beforeScene = scene();
    beforeAssets = await assets();
    guard();
    const beforeIds = new Set([
      page.id,
      ...page.findAll(() => true).map(node => node.id),
    ]);
    const inventory = await figmaApi.listAvailableFontsAsync();
    guard();
    for (const font of [
      { family: 'Inter', style: 'Regular' },
      ...fonts.values(),
    ]) {
      if (
        !inventory.some(
          entry =>
            entry.fontName.family === font.family &&
            entry.fontName.style === font.style
        )
      )
        fail(`named face unavailable: ${font.family} ${font.style}.`);
      await figmaApi.loadFontAsync(font);
      guard();
    }
    for (const input of fonts.values()) {
      guard();
      const axisTags = figmaApi.getFontFamilyVariationAxes(input.family);
      let probe;
      try {
        guard();
        probe = figmaApi.createText();
        if (!probe || beforeIds.has(probe.id)) {
          probe = null;
          fail('createText did not return a fresh owned probe.');
        }
        probes.push(probe);
        report.createdNodeIds.push(probe.id);
        if (
          probe.type !== 'TEXT' ||
          probe.parent !== page ||
          probe.characters !== '' ||
          probe.fontName.family !== 'Inter' ||
          probe.fontName.style !== 'Regular'
        )
          fail('probe is not a fresh empty current-page TEXT.');
        guard();
        probe.fontName = input;
        const native = probe.fontName;
        const concrete = mgRichText.resolveFontInput(
          input,
          [
            {
              fontName: {
                family: native.family,
                style: native.style,
                ...(native.variationSettings === undefined
                  ? {}
                  : { variationSettings: { ...native.variationSettings } }),
              },
            },
          ],
          axisTags
        );
        guard();
        for (const requested of inputs.filter(
          font => font.family === input.family && font.style === input.style
        ))
          mgRichText.resolveFontInput(
            requested,
            [{ fontName: concrete }],
            axisTags
          );
        report.resolvedFonts.push({
          input: { ...input },
          fontName: concrete,
          axisTags: axisTags === null ? null : [...axisTags],
          nodeId: probe.id,
        });
      } finally {
        // A changed target never authorizes another write there. Cleanup uses
        // only the captured fresh probe object, never a looked-up scene node.
        if (probe && !probe.removed) probe.remove();
        if (probe) {
          let residual;
          try {
            residual = await figmaApi.getNodeByIdAsync(probe.id);
          } catch (error) {
            report.unverifiedRemovalNodeIds.push(probe.id);
            throw error;
          }
          if (residual) report.residualNodeIds.push(probe.id);
          else report.removedNodeIds.push(probe.id);
          guard();
        }
      }
      if (report.residualNodeIds.length)
        fail('probe cleanup left residual nodes.');
    }
    guard();
    report.recordedSceneExact = scene() === beforeScene;
    report.recordedAssetsExact = (await assets()) === beforeAssets;
    guard();
    if (!report.recordedSceneExact || !report.recordedAssetsExact)
      fail('existing scene or assets changed during preparation.');
  } catch (error) {
    report.errors.push(error.message || String(error));
    // Retry cleanup of captured owned probes even after a guard/load failure.
    for (const probe of probes) {
      try {
        if (!probe.removed) probe.remove();
        let residual;
        try {
          residual = await figmaApi.getNodeByIdAsync(probe.id);
        } catch (error) {
          if (!report.unverifiedRemovalNodeIds.includes(probe.id))
            report.unverifiedRemovalNodeIds.push(probe.id);
          throw error;
        }
        report.unverifiedRemovalNodeIds =
          report.unverifiedRemovalNodeIds.filter(id => id !== probe.id);
        if (!residual) {
          if (!report.removedNodeIds.includes(probe.id))
            report.removedNodeIds.push(probe.id);
          report.residualNodeIds = report.residualNodeIds.filter(
            id => id !== probe.id
          );
        } else if (!report.residualNodeIds.includes(probe.id))
          report.residualNodeIds.push(probe.id);
      } catch (cleanup) {
        report.errors.push(
          `Probe ${probe.id} cleanup failed: ${cleanup.message || cleanup}`
        );
      }
      try {
        if (!probe.removed && !report.residualNodeIds.includes(probe.id))
          report.residualNodeIds.push(probe.id);
      } catch (verification) {
        if (!report.unverifiedRemovalNodeIds.includes(probe.id))
          report.unverifiedRemovalNodeIds.push(probe.id);
        report.errors.push(
          `Probe removal state unreadable: ${verification.message || verification}`
        );
      }
    }
    try {
      if (beforeScene !== undefined)
        report.recordedSceneExact = scene() === beforeScene;
    } catch (verification) {
      report.errors.push(
        `Scene verification failed: ${verification.message || verification}`
      );
    }
    try {
      guard();
      if (beforeAssets !== undefined)
        report.recordedAssetsExact = (await assets()) === beforeAssets;
      guard();
    } catch (verification) {
      report.errors.push(
        `Preparation verification failed: ${verification.message || verification}`
      );
    }
  }
  return report;
}
if (typeof module !== 'undefined')
  module.exports = { mgResolveNamedFontDefaults };
