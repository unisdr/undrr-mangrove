/* global mgReadIdentity, mgWriteIdentity, figma, importStyles, errorMessage */
// Native component construction from exporter-owned recipes. Bundled at build time.
const MG_KIT_KEY = 'mgKitId';
const MG_KIT_PROPERTY_KEY = 'mgKitProperties';

async function buildMangroveComponents(
  doc,
  brandId,
  selectedFamilyIds,
  { refreshNarrowReview = false } = {}
) {
  if (typeof refreshNarrowReview !== 'boolean')
    throw new Error('Refresh narrow review must be a boolean.');
  const result = {
    createdNodeIds: [],
    updatedNodeIds: [],
    families: [],
    errors: [],
    audit: [],
    reviewRootId: null,
  };
  const created = new Set();
  const updated = new Set();
  const reportError = error =>
    typeof errorMessage === 'function' ? errorMessage(error) : String(error);
  const recipes = doc.components?.families || [];
  if (doc.components?.version !== 1 || !recipes.length) {
    result.errors.push(
      'No supported component recipes. Rebuild the token JSON.'
    );
    return result;
  }
  const brand = doc.modes.find(mode => mode.id === brandId);
  if (!brand) throw new Error(`Unknown brand ${brandId}`);
  const page = figma.currentPage;
  const allOwned = page.findAll(node =>
    Boolean(mgReadIdentity(node, MG_KIT_KEY))
  );
  const owned = new Map();
  for (const node of allOwned) {
    // Instance descendants inherit source plugin data. Only index construction nodes.
    let ancestor = node.parent;
    let insideInstance = false;
    while (ancestor && ancestor !== page) {
      if (ancestor.type === 'INSTANCE') insideInstance = true;
      ancestor = ancestor.parent;
    }
    if (insideInstance) continue;
    const key = mgReadIdentity(node, MG_KIT_KEY);
    if (owned.has(key))
      throw new Error(`Duplicate Mangrove ownership key ${key}`);
    owned.set(key, node);
  }
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collection = collections.find(item => item.name === doc.collection);
  if (!collection)
    throw new Error('Import Mangrove variables before components.');
  const mode = collection.modes.find(item => item.name === brand.name);
  if (!mode)
    throw new Error(`Import the ${brand.name} brand before components.`);
  const variables = new Map(
    (await figma.variables.getLocalVariablesAsync())
      .filter(variable => variable.variableCollectionId === collection.id)
      .map(variable => [variable.name, variable])
  );
  const textSpecs = new Map(
    (doc.styles?.text || []).map(spec => [spec.id, spec])
  );
  const effectSpecs = new Map(
    (doc.styles?.effect || []).map(spec => [spec.id, spec])
  );
  const families = new Map(recipes.map(recipe => [recipe.id, recipe]));
  const sourceLabel = family =>
    typeof family.source === 'string'
      ? family.source
      : family.source
        ? `${family.source.file}:${family.source.line}`
        : '';
  const chosen = new Set(selectedFamilyIds || recipes.map(recipe => recipe.id));
  const treeWalk = (tree, visit) => {
    visit(tree);
    for (const child of tree.children || []) treeWalk(child, visit);
  };
  // Review geometry and content are initial specimen seeds, not repeat-build edits.
  function reviewTarget(tree, path) {
    if (
      !Array.isArray(path) ||
      !path.length ||
      path.some(name => typeof name !== 'string' || !name)
    )
      throw new Error('Review node needs a nonempty anatomy path.');
    for (const name of path) {
      if (tree.type === 'INSTANCE')
        tree = families
          .get(tree.family)
          ?.variants.find(item =>
            matches(item.properties, tree.variant || {})
          )?.tree;
      const children = (tree?.children || []).filter(
        child => child.name === name
      );
      if (children.length !== 1)
        throw new Error(`Ambiguous or missing review node ${name}`);
      tree = children[0];
    }
    return tree;
  }
  function reviewDimension(value) {
    if (typeof value === 'string') variable(value, 'FLOAT');
    else if (!Number.isFinite(value) || value <= 0)
      throw new Error(
        'Review geometry must be a positive size or FLOAT variable.'
      );
  }
  const dependencies = recipe => {
    const names = new Set();
    for (const variant of recipe.variants)
      treeWalk(variant.tree, tree => {
        if (tree.type === 'INSTANCE') names.add(tree.family);
      });
    return [...names];
  };
  const ordered = [];
  const visited = new Set();
  const visiting = new Set();
  function order(id) {
    if (visited.has(id)) return;
    if (visiting.has(id))
      throw new Error(`Component dependency cycle at ${id}`);
    const family = families.get(id);
    if (!family) throw new Error(`Unknown component family ${id}`);
    visiting.add(id);
    for (const dependency of dependencies(family)) order(dependency);
    visiting.delete(id);
    visited.add(id);
    ordered.push(family);
  }
  for (const id of chosen) order(id);

  function variable(name, type) {
    const value = variables.get(name);
    if (!value || value.resolvedType !== type)
      throw new Error(`Missing ${type} variable ${name}`);
    return value;
  }
  const available = await figma.listAvailableFontsAsync();
  const fontPromises = new Map();
  async function load(font) {
    const key = JSON.stringify(font);
    if (!fontPromises.has(key)) {
      fontPromises.set(
        key,
        (async () => {
          if (
            !available.some(
              entry =>
                entry.fontName.family === font.family &&
                entry.fontName.style === font.style
            )
          )
            throw new Error(
              `Font "${font.family} ${font.style}" is unavailable.`
            );
          await figma.loadFontAsync(font);
        })()
      );
    }
    await fontPromises.get(key);
  }
  async function loadNodeFonts(root) {
    const texts =
      root.type === 'TEXT'
        ? [root]
        : 'findAllWithCriteria' in root
          ? root.findAllWithCriteria({ types: ['TEXT'] })
          : [];
    for (const text of texts) {
      if (text.fontName !== figma.mixed) await load(text.fontName);
      else
        for (const segment of text.getStyledTextSegments(['fontName']))
          await load(segment.fontName);
    }
  }
  // Changing a container's mode can change text across every descendant family.
  // Prepare that whole subtree only for a real transition, before any writes.
  for (const key of ['main', 'review']) {
    const frame = owned.get(key);
    if (!frame) continue;
    try {
      if (frame.type !== 'FRAME')
        throw new Error(`Owned ${key} container has changed type.`);
      if (frame.explicitVariableModes[collection.id] !== mode.modeId)
        await loadNodeFonts(frame);
    } catch (error) {
      const reason = reportError(error);
      result.errors.push(`${frame.name}: ${reason}`);
      result.audit.push({
        nodeId: frame.id,
        status: 'blocked-container-mode-transition',
        reason,
      });
      return result;
    }
  }
  const allowedBindings = new Set([
    'cornerRadius',
    'topLeftRadius',
    'topRightRadius',
    'bottomLeftRadius',
    'bottomRightRadius',
    'strokeWeight',
    'strokeTopWeight',
    'strokeBottomWeight',
    'strokeLeftWeight',
    'strokeRightWeight',
    'opacity',
    'minWidth',
    'maxWidth',
    'minHeight',
    'maxHeight',
    'width',
    'height',
    'itemSpacing',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'visible',
  ]);
  const ready = [];
  const blocked = new Set();
  const usedText = new Set();
  const usedEffects = new Set();
  for (const family of ordered) {
    try {
      if (dependencies(family).some(id => blocked.has(id)))
        throw new Error('A required component family could not be prepared.');
      if (family.kind !== 'component-set' || !family.variants.length)
        throw new Error('Expected a component set with at least one variant.');
      const variantIds = new Set();
      const familyText = new Set();
      const familyEffects = new Set();
      const propertyTypes = new Map();
      function recordProperty(name, type) {
        if (propertyTypes.has(name) && propertyTypes.get(name) !== type)
          throw new Error(`Conflicting component property type for ${name}`);
        propertyTypes.set(name, type);
      }
      for (const name of Object.keys(family.optionalProperties || {}))
        recordProperty(name, 'BOOLEAN');
      if (
        family.review?.genericLabels !== undefined &&
        typeof family.review.genericLabels !== 'boolean'
      )
        throw new Error('Review genericLabels must be a boolean.');
      if (
        family.review?.width !== undefined &&
        (!Number.isFinite(family.review.width) || family.review.width <= 0)
      )
        throw new Error('Review width must be positive and finite.');
      for (const variant of family.variants) {
        if (variantIds.has(variant.id))
          throw new Error(`Duplicate variant ${variant.id}`);
        variantIds.add(variant.id);
        if (variant.tree.type !== 'FRAME')
          throw new Error('Variant root must be FRAME.');
        if (family.review?.longLabelTarget !== undefined) {
          const path = family.review.longLabelTarget;
          if (
            !Array.isArray(path) ||
            !path.length ||
            path.some(name => typeof name !== 'string' || !name)
          )
            throw new Error(
              'Long-label target must be a nonempty anatomy path.'
            );
          let target = variant.tree;
          for (const name of path) {
            const matches = (target.children || []).filter(
              child => child.name === name
            );
            if (matches.length !== 1)
              throw new Error(
                `Ambiguous or missing review label target ${name}`
              );
            target = matches[0];
          }
          if (target.type !== 'INSTANCE')
            throw new Error('Long-label target must be a nested instance.');
        }
        const keys = new Set();
        treeWalk(variant.tree, tree => {
          if (tree.textProperty) recordProperty(tree.textProperty, 'TEXT');
          if (tree.visibilityProperty)
            recordProperty(tree.visibilityProperty, 'BOOLEAN');
          if (!['FRAME', 'TEXT', 'INSTANCE'].includes(tree.type))
            throw new Error(`Unsupported recipe node ${tree.type}`);
          if (!tree.id && !tree.key)
            throw new Error(`Node ${tree.name} needs a stable id.`);
          if (
            tree.expose !== undefined &&
            (tree.type !== 'INSTANCE' || typeof tree.expose !== 'boolean')
          )
            throw new Error(
              'Only nested instance recipes may declare boolean expose.'
            );
          const key = tree.id || tree.key;
          if (keys.has(key)) throw new Error(`Duplicate recipe node id ${key}`);
          keys.add(key);
          if (tree.fill) variable(tree.fill, 'COLOR');
          if (tree.stroke) variable(tree.stroke, 'COLOR');
          if (tree.focusRing) {
            if (tree.effectStyle)
              throw new Error(
                'Native focus outlines cannot also use a focus effect.'
              );
            if (tree.type !== 'FRAME')
              throw new Error('Native focus outlines require a frame recipe.');
            variable(tree.focusRing.color, 'COLOR');
            variable(tree.focusRing.separatorColor, 'COLOR');
            for (const field of ['offset', 'width', 'radius'])
              variable(tree.focusRing[field], 'FLOAT');
            if (tree.focusRing.outerRadius)
              variable(tree.focusRing.outerRadius, 'FLOAT');
          }
          for (const [field, name] of Object.entries(tree.bindings || {})) {
            if (!allowedBindings.has(field))
              throw new Error(`Unsupported binding ${field}`);
            variable(name, field === 'visible' ? 'BOOLEAN' : 'FLOAT');
          }
          const layout = tree.layout || {};
          if (
            layout.wrap !== undefined &&
            !['NO_WRAP', 'WRAP'].includes(layout.wrap)
          )
            throw new Error('Layout wrap must be NO_WRAP or WRAP.');
          for (const name of [
            layout.padding?.block,
            layout.padding?.inline,
            layout.gap,
            layout.counterGap,
            layout.minHeight,
            layout.maxHeight,
            layout.maxWidth,
            layout.minWidth,
            layout.width,
            layout.height,
          ]) {
            if (typeof name === 'string' && !['HUG', 'FILL'].includes(name))
              variable(name, 'FLOAT');
          }
          if (tree.type === 'TEXT') {
            if (
              tree.textWrap !== undefined &&
              !['BALANCE', 'WRAP', 'TRUNCATE'].includes(tree.textWrap)
            )
              throw new Error('Unsupported text wrapping style.');
            if (!textSpecs.has(tree.textStyle))
              throw new Error(`Missing exported text style ${tree.textStyle}`);
            familyText.add(tree.textStyle);
          }
          if (tree.effectStyle) {
            if (!effectSpecs.has(tree.effectStyle))
              throw new Error(
                `Missing exported effect style ${tree.effectStyle}`
              );
            familyEffects.add(tree.effectStyle);
          }
          if (tree.type === 'INSTANCE') {
            if (tree.labelSizing !== undefined && tree.labelSizing !== 'FILL')
              throw new Error('Instance labelSizing supports only FILL.');
            const dependency = families.get(tree.family);
            if (
              !dependency?.variants.some(item =>
                matches(item.properties, tree.variant || {})
              )
            )
              throw new Error(`No matching ${tree.family} variant.`);
            if (tree.appearance !== undefined) {
              if (
                !tree.appearance ||
                typeof tree.appearance !== 'object' ||
                Array.isArray(tree.appearance) ||
                Object.keys(tree.appearance).some(
                  field => !['fill', 'stroke', 'labelFill'].includes(field)
                )
              )
                throw new Error(
                  'Instance appearance supports only fill, stroke and labelFill.'
                );
              for (const name of Object.values(tree.appearance))
                variable(name, 'COLOR');
              if (tree.appearance.labelFill) {
                const selected = dependency.variants.find(item =>
                  matches(item.properties, tree.variant || {})
                );
                const labels = [];
                treeWalk(selected.tree, child => {
                  if (child.type === 'TEXT' && child.textProperty === 'Label')
                    labels.push(child);
                });
                if (labels.length !== 1)
                  throw new Error(
                    'Contextual label fill requires exactly one Label text node.'
                  );
              }
            }
          } else if (tree.appearance !== undefined)
            throw new Error(
              'Contextual appearance is only supported on native instances.'
            );
        });
      }
      if (family.review?.specimens !== undefined) {
        const specimens = family.review.specimens;
        if (!Array.isArray(specimens) || specimens.length > 8)
          throw new Error(
            'Review specimens must be an array of at most eight entries.'
          );
        const specimenIds = new Set([...variantIds, 'long-label', 'narrow']);
        for (const specimen of specimens) {
          if (
            !specimen ||
            !/^[a-z0-9][a-z0-9-]*$/.test(specimen.id || '') ||
            specimenIds.has(specimen.id)
          )
            throw new Error('Review specimen needs a unique stable id.');
          specimenIds.add(specimen.id);
          if (typeof specimen.name !== 'string' || !specimen.name)
            throw new Error('Review specimen needs a name.');
          if (
            !specimen.variant ||
            family.variants.filter(variant =>
              matches(variant.properties, specimen.variant)
            ).length !== 1
          )
            throw new Error(
              `Review specimen ${specimen.id} needs one matching variant.`
            );
          if (!Number.isFinite(specimen.width) || specimen.width <= 0)
            throw new Error(
              `Review specimen ${specimen.id} needs a positive finite width.`
            );
          if (
            !specimen.properties ||
            typeof specimen.properties !== 'object' ||
            Array.isArray(specimen.properties)
          )
            throw new Error(
              `Review specimen ${specimen.id} needs named property overrides.`
            );
          for (const [name, value] of Object.entries(specimen.properties)) {
            const type = propertyTypes.get(name);
            if (
              !type ||
              (type === 'TEXT'
                ? typeof value !== 'string'
                : typeof value !== 'boolean')
            )
              throw new Error(
                `Review specimen ${specimen.id} property ${name} must match a named TEXT or BOOLEAN property.`
              );
          }
          if (specimen.instanceWidth !== undefined)
            reviewDimension(specimen.instanceWidth);
          if (specimen.nodes !== undefined) {
            if (!Array.isArray(specimen.nodes) || specimen.nodes.length > 64)
              throw new Error(
                'Review nodes must be an array of at most 64 entries.'
              );
            const root = family.variants.find(item =>
              matches(item.properties, specimen.variant)
            ).tree;
            for (const seed of specimen.nodes) {
              const target = reviewTarget(root, seed.path);
              if (seed.width !== undefined || seed.height !== undefined)
                throw new Error(
                  'Nested review dimensions are unsupported in real Figma. Put shared geometry on component masters.'
                );
              if (seed.properties !== undefined) {
                if (
                  target.type !== 'INSTANCE' ||
                  !seed.properties ||
                  typeof seed.properties !== 'object' ||
                  Array.isArray(seed.properties)
                )
                  throw new Error(
                    'Review property seeds require a nested instance and named properties.'
                  );
                const dependency = families
                  .get(target.family)
                  .variants.find(item =>
                    matches(item.properties, target.variant || {})
                  );
                const types = new Map();
                treeWalk(dependency.tree, node => {
                  if (node.textProperty) types.set(node.textProperty, 'TEXT');
                  if (node.visibilityProperty)
                    types.set(node.visibilityProperty, 'BOOLEAN');
                });
                for (const [name, value] of Object.entries(seed.properties))
                  if (
                    !types.has(name) ||
                    typeof value !==
                      (types.get(name) === 'TEXT' ? 'string' : 'boolean')
                  )
                    throw new Error(
                      `Review nested property ${name} does not match its component contract.`
                    );
              }
            }
          }
        }
      }
      for (const id of familyText) {
        const spec = textSpecs.get(id);
        for (const entry of Object.values(spec.values))
          await load(entry.fontName);
        variable(spec.bindings.fontFamily, 'STRING');
        variable(spec.bindings.fontSize, 'FLOAT');
      }
      for (const id of familyEffects) {
        const spec = effectSpecs.get(id);
        if (!spec.values[brandId])
          throw new Error(`Missing brand values for ${id}`);
        for (const entry of spec.values[brandId])
          for (const [field, name] of Object.entries(entry.bindings || {}))
            variable(name, field === 'color' ? 'COLOR' : 'FLOAT');
      }
      const existingSet = owned.get(`family/${family.id}`);
      if (existingSet) {
        if (existingSet.type !== 'COMPONENT_SET')
          throw new Error('Owned set has changed type.');
        await loadNodeFonts(existingSet);
      }
      // Creating a text node starts with Inter before the source style is applied.
      await load({ family: 'Inter', style: 'Regular' });
      ready.push(family);
      familyText.forEach(id => usedText.add(id));
      familyEffects.forEach(id => usedEffects.add(id));
    } catch (error) {
      blocked.add(family.id);
      result.errors.push(`${family.name}: ${reportError(error)}`);
      result.audit.push({
        family: family.id,
        status: 'blocked',
        reason: reportError(error),
      });
    }
  }
  if (!ready.length) return result;
  // Restrict effects to the recipes being prepared, avoiding unrelated updates.
  const styleDoc = {
    ...doc,
    styles: {
      text: doc.styles.text,
      effect: [...usedEffects].map(id => effectSpecs.get(id)),
    },
  };
  const styles = await importStyles(
    styleDoc,
    variables,
    brandId,
    [...usedText],
    usedEffects.size > 0
  );
  result.styles = styles;
  result.errors.push(...styles.errors);
  const localText = new Map(
    (await figma.getLocalTextStylesAsync()).map(style => [
      mgReadIdentity(style, 'mgStyleId'),
      style,
    ])
  );
  const localEffects = new Map(
    (await figma.getLocalEffectStylesAsync()).map(style => [
      mgReadIdentity(style, 'mgStyleId'),
      style,
    ])
  );
  const failedStyleIds = new Set();
  for (const spec of [...textSpecs.values(), ...effectSpecs.values()]) {
    if (styles.errors.some(error => error.startsWith(`${spec.name}:`)))
      failedStyleIds.add(spec.id);
  }
  if (
    styles.errors.some(error => error.startsWith('Could not list text styles:'))
  )
    usedText.forEach(id => failedStyleIds.add(id));
  if (
    styles.errors.some(error =>
      error.startsWith('Could not list effect styles:')
    )
  )
    usedEffects.forEach(id => failedStyleIds.add(id));

  function mark(node, key, isNew) {
    if (isNew) {
      mgWriteIdentity(node, MG_KIT_KEY, key);
      owned.set(key, node);
      created.add(node.id);
      if (node.type === 'INSTANCE')
        node.findAll(() => true).forEach(child => created.add(child.id));
    } else if (!created.has(node.id)) updated.add(node.id);
    return node;
  }
  function matches(values, requested) {
    return Object.entries(requested).every(
      ([key, value]) => values?.[key] === value
    );
  }
  function getPropertyOwner(component) {
    return component.parent?.type === 'COMPONENT_SET'
      ? component.parent
      : component;
  }
  function ensureProperty(component, name, type, defaultValue) {
    const owner = getPropertyOwner(component);
    let map;
    try {
      map = JSON.parse(mgReadIdentity(owner, MG_KIT_PROPERTY_KEY) || '{}');
    } catch {
      throw new Error('Owned component property map is invalid.');
    }
    const definitions = owner.componentPropertyDefinitions;
    let key = map[name];
    if (key && definitions[key]?.type !== type)
      throw new Error(`Owned property ${name} was removed or changed type.`);
    if (!key) {
      key = Object.keys(definitions).find(
        item =>
          item.replace(/#[^#]+$/, '') === name &&
          definitions[item].type === type
      );
      key = key || owner.addComponentProperty(name, type, defaultValue);
      map[name] = key;
      mgWriteIdentity(owner, MG_KIT_PROPERTY_KEY, JSON.stringify(map));
    }
    return key;
  }
  function bind(node, field, name) {
    const bound = variable(name, field === 'visible' ? 'BOOLEAN' : 'FLOAT');
    const resolved = bound.resolveForConsumer(node);
    if (field === 'width' || field === 'height')
      node.resize(
        field === 'width' ? resolved.value : node.width,
        field === 'height' ? resolved.value : node.height
      );
    else
      // Opacity variables use percentages; native node properties use 0..1.
      node[field] =
        field === 'opacity'
          ? Math.max(0, Math.min(100, resolved.value)) / 100
          : resolved.value;
    node.setBoundVariable(field, bound);
  }
  function paint(node, field, name) {
    if (!name) {
      node[field] = [];
      return;
    }
    const bound = variable(name, 'COLOR');
    const color = bound.resolveForConsumer(node).value;
    const value = figma.variables.setBoundVariableForPaint(
      {
        type: 'SOLID',
        color: { r: color.r, g: color.g, b: color.b },
        opacity: color.a ?? 1,
      },
      'color',
      bound
    );
    node[field] = [value];
  }
  function setNumeric(node, field, value) {
    if (typeof value === 'string') bind(node, field, value);
    else if (typeof value === 'number') {
      node.setBoundVariable(field, null);
      node[field] = value;
    }
  }
  function applyLayout(node, layout = {}) {
    if (layout.mode && 'layoutMode' in node) {
      node.layoutMode = layout.mode;
      node.primaryAxisAlignItems =
        layout.justify || layout.primaryAlign || 'MIN';
      // Stretch is expressed through child FILL sizing, not an alignment enum.
      node.counterAxisAlignItems =
        layout.align === 'STRETCH'
          ? 'MIN'
          : layout.align || layout.counterAlign || 'MIN';
      node.clipsContent = Boolean(layout.clipsContent);
      if (layout.wrap !== undefined) node.layoutWrap = layout.wrap;
    }
    if (layout.padding) {
      setNumeric(node, 'paddingTop', layout.padding.block);
      setNumeric(node, 'paddingBottom', layout.padding.block);
      setNumeric(node, 'paddingLeft', layout.padding.inline);
      setNumeric(node, 'paddingRight', layout.padding.inline);
    }
    setNumeric(node, 'itemSpacing', layout.gap);
    setNumeric(node, 'counterAxisSpacing', layout.counterGap);
    setNumeric(node, 'minHeight', layout.minHeight);
    setNumeric(node, 'maxHeight', layout.maxHeight);
    setNumeric(node, 'minWidth', layout.minWidth);
    setNumeric(node, 'maxWidth', layout.maxWidth);
    const boundWidth =
      typeof layout.width === 'string' &&
      !['HUG', 'FILL'].includes(layout.width);
    const boundHeight =
      typeof layout.height === 'string' &&
      !['HUG', 'FILL'].includes(layout.height);
    const fixedWidth = typeof layout.width === 'number' || boundWidth;
    const fixedHeight = typeof layout.height === 'number' || boundHeight;
    const width = boundWidth
      ? variable(layout.width, 'FLOAT').resolveForConsumer(node).value
      : layout.width;
    const height = boundHeight
      ? variable(layout.height, 'FLOAT').resolveForConsumer(node).value
      : layout.height;
    const rootFill =
      node.parent?.type === 'COMPONENT_SET' && layout.width === 'FILL';
    // FILL requires an auto-layout parent. Main variants have a fixed specimen width.
    if (rootFill) node.resize(320, node.height);
    const previousHorizontal = node.layoutSizingHorizontal;
    const previousVertical = node.layoutSizingVertical;
    if (['HUG', 'FILL'].includes(layout.width))
      node.setBoundVariable('width', null);
    if (['HUG', 'FILL'].includes(layout.height))
      node.setBoundVariable('height', null);
    if (fixedWidth) node.setBoundVariable('width', null);
    if (fixedHeight) node.setBoundVariable('height', null);
    if (fixedWidth || fixedHeight) {
      node.resize(
        fixedWidth ? width : node.width,
        fixedHeight ? height : node.height
      );
      // resize fixes both axes in real Figma. Preserve an unspecified FILL/HUG
      // axis, especially for nested table rows and cells.
      if (!fixedWidth && !layout.width)
        node.layoutSizingHorizontal = previousHorizontal;
      if (!fixedHeight && !layout.height)
        node.layoutSizingVertical = previousVertical;
    }
    if (node.type === 'TEXT') {
      const wraps = layout.width === 'FILL' || fixedWidth;
      node.textAutoResize = wraps ? 'HEIGHT' : 'WIDTH_AND_HEIGHT';
      if (wraps)
        node.layoutSizingHorizontal =
          layout.width === 'FILL' ? 'FILL' : 'FIXED';
      else node.layoutSizingHorizontal = 'HUG';
      node.layoutSizingVertical = 'HUG';
    } else {
      if (layout.width)
        node.layoutSizingHorizontal =
          fixedWidth || rootFill ? 'FIXED' : layout.width;
      if (layout.height)
        node.layoutSizingVertical = fixedHeight ? 'FIXED' : layout.height;
    }
    if (boundWidth)
      node.setBoundVariable('width', variable(layout.width, 'FLOAT'));
    if (boundHeight)
      node.setBoundVariable('height', variable(layout.height, 'FLOAT'));
  }
  const built = new Map();
  async function focusDecorations(spec, parent, key) {
    const roles = ['outer', 'separator'];
    if (!spec.focusRing) {
      const retained = [];
      for (const role of roles) {
        const node = owned.get(`${key}/focus/${role}`);
        if (node) {
          node.visible = false;
          mark(node, `${key}/focus/${role}`, false);
          retained.push(node);
        }
      }
      return retained;
    }
    const ring = spec.focusRing;
    const number = name =>
      variable(name, 'FLOAT').resolveForConsumer(parent).value;
    const offset = number(ring.offset);
    const width = number(ring.width);
    const radius = number(ring.radius);
    const outerRadius = ring.outerRadius
      ? number(ring.outerRadius)
      : radius + offset;
    if (
      ![offset, width, radius, outerRadius].every(
        value => Number.isFinite(value) && value >= 0
      )
    )
      throw new Error(`Invalid native focus outline dimensions at ${key}`);
    parent.clipsContent = false;
    const decorations = [];
    for (const role of roles) {
      const id = `${key}/focus/${role}`;
      let node = owned.get(id);
      if (node && node.type !== 'RECTANGLE')
        throw new Error(`Native focus outline ${id} changed type.`);
      const fresh = !node;
      node = node || figma.createRectangle();
      mark(node, id, fresh);
      if (node.parent !== parent) parent.appendChild(node);
      node.name =
        role === 'outer'
          ? 'mg-focus-ring / coloured outline'
          : 'mg-focus-ring / neutral separator';
      node.visible = true;
      node.layoutPositioning = 'ABSOLUTE';
      node.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
      node.fills = [];
      await node.setEffectStyleIdAsync('');
      node.effects = [];
      node.strokeAlign = 'OUTSIDE';
      if (role === 'outer') {
        node.resize(parent.width + offset * 2, parent.height + offset * 2);
        node.x = -offset;
        node.y = -offset;
        paint(node, 'strokes', ring.color);
        bind(node, 'strokeWeight', ring.width);
        if (ring.outerRadius) bind(node, 'cornerRadius', ring.outerRadius);
        else {
          node.setBoundVariable('cornerRadius', null);
          node.cornerRadius = outerRadius;
        }
      } else {
        node.resize(parent.width, parent.height);
        node.x = 0;
        node.y = 0;
        paint(node, 'strokes', ring.separatorColor);
        bind(node, 'strokeWeight', ring.offset);
        bind(node, 'cornerRadius', ring.radius);
      }
      decorations.push(node);
    }
    result.audit.push({
      nodeId: parent.id,
      status: 'native-focus-outline',
      rectangleIds: decorations.map(node => node.id),
      geometry: { offset, width, radius, outerRadius },
      sourceBindings: ring,
      limitation:
        'Absolute outline offsets follow source values at build time; stretch constraints preserve resizing. Rebuild if the focus offset changes.',
    });
    return decorations;
  }
  async function treeNode(spec, parent, component, key, rootNode) {
    let node = rootNode || owned.get(key);
    const fresh = !node;
    if (node && !rootNode && node.type !== spec.type)
      throw new Error(
        `Node type changed at ${key}. Preserve the old node and resolve the recipe.`
      );
    if (!node) {
      if (spec.type === 'TEXT') node = figma.createText();
      else if (spec.type === 'FRAME') node = figma.createFrame();
      else {
        const dependency = built.get(spec.family);
        const variant = dependency?.variants.find(item =>
          matches(item.recipe.properties, spec.variant || {})
        );
        if (!variant)
          throw new Error(`Dependency ${spec.family} is not available.`);
        node = variant.node.createInstance();
      }
      mark(node, key, true);
    } else mark(node, key, false);
    if (node.type === 'TEXT') await loadNodeFonts(node);
    if (node.parent !== parent) parent.appendChild(node);
    // A variant name must remain valid while reading its set's property definitions.
    if (!rootNode) node.name = spec.name || spec.id || spec.type;
    node.visible = spec.visible !== false;
    if (spec.type === 'TEXT') {
      const style = localText.get(spec.textStyle);
      if (!style)
        throw new Error(`Text style ${spec.textStyle} did not import.`);
      await figma.loadFontAsync(style.fontName);
      await node.setTextStyleIdAsync(style.id);
      node.characters = spec.characters || '';
      node.textAlignHorizontal = spec.textAlign || 'LEFT';
      if (spec.textWrap !== undefined) node.textWrapStyle = spec.textWrap;
    }
    if (spec.type !== 'INSTANCE') {
      if (spec.layout?.mode && 'layoutMode' in node)
        node.layoutMode = spec.layout.mode;
      if ('fills' in node) paint(node, 'fills', spec.fill);
      if ('strokes' in node) paint(node, 'strokes', spec.stroke);
      node.strokeAlign = spec.strokeAlign || 'INSIDE';
      if ('strokesIncludedInLayout' in node && node.layoutMode !== 'NONE')
        node.strokesIncludedInLayout = spec.strokesIncludedInLayout !== false;
      for (const oldField of Object.keys(node.boundVariables || {})) {
        if (
          allowedBindings.has(oldField) &&
          !(oldField in (spec.bindings || {}))
        )
          node.setBoundVariable(oldField, null);
      }
      for (const [field, name] of Object.entries(spec.bindings || {}))
        bind(node, field, name);
      if (spec.effectStyle) {
        const style = localEffects.get(spec.effectStyle);
        if (!style)
          throw new Error(`Effect style ${spec.effectStyle} did not import.`);
        await node.setEffectStyleIdAsync(style.id);
        // Spread on frames/components requires a visible fill and clipping.
        if (['FRAME', 'COMPONENT'].includes(node.type))
          node.clipsContent = true;
      } else {
        await node.setEffectStyleIdAsync('');
        node.effects = [];
      }
      if (spec.textProperty)
        node.componentPropertyReferences = {
          ...(node.componentPropertyReferences || {}),
          characters: ensureProperty(
            component,
            spec.textProperty,
            'TEXT',
            spec.characters || ''
          ),
        };
      if (spec.visibilityProperty)
        node.componentPropertyReferences = {
          ...(node.componentPropertyReferences || {}),
          visible: ensureProperty(
            component,
            spec.visibilityProperty,
            'BOOLEAN',
            spec.visible !== false
          ),
        };
    } else {
      const dependency = built.get(spec.family);
      const variant = dependency.variants.find(item =>
        matches(item.recipe.properties, spec.variant || {})
      );
      const currentMain = await node.getMainComponentAsync();
      if (currentMain?.id !== variant.node.id) node.swapComponent(variant.node);
      await loadNodeFonts(node);
      const overrides = {};
      for (const [name, value] of Object.entries(spec.overrides || {})) {
        const property = Object.keys(node.componentProperties).find(
          item => item.replace(/#[^#]+$/, '') === name
        );
        if (!property)
          throw new Error(`Instance property ${name} is unavailable.`);
        overrides[property] = value;
      }
      if (Object.keys(overrides).length) node.setProperties(overrides);
      // These are primary nested instances in the owned main component.
      // Review descendants inherit exposure; do not write their inherited flag.
      node.isExposedInstance = Boolean(spec.expose);
      // Explicit instance bindings override only the declared inherited fields.
      for (const [field, name] of Object.entries(spec.bindings || {}))
        bind(node, field, name);
      // Contextual CSS colours stay on the native instance; geometry and identity
      // continue to come from its source component. Never detach nested actions.
      if (spec.appearance) {
        if (spec.appearance.fill) paint(node, 'fills', spec.appearance.fill);
        if (spec.appearance.stroke)
          paint(node, 'strokes', spec.appearance.stroke);
        if (spec.appearance.labelFill) {
          const labels = node
            .findAllWithCriteria({ types: ['TEXT'] })
            .filter(
              child =>
                child.componentPropertyReferences?.characters?.replace(
                  /#[^#]+$/,
                  ''
                ) === 'Label'
            );
          if (labels.length !== 1)
            throw new Error(
              'Contextual label fill requires exactly one Label text node.'
            );
          paint(labels[0], 'fills', spec.appearance.labelFill);
          if (fresh) created.add(labels[0].id);
          else updated.add(labels[0].id);
        }
      }
    }
    applyLayout(node, spec.layout);
    if (spec.labelSizing === 'FILL') {
      const labels = node
        .findAllWithCriteria({ types: ['TEXT'] })
        .filter(
          child =>
            child.componentPropertyReferences?.characters?.replace(
              /#[^#]+$/,
              ''
            ) === 'Label'
        );
      if (labels.length !== 1)
        throw new Error(
          'Instance labelSizing requires exactly one Label text node.'
        );
      labels[0].textAutoResize = 'HEIGHT';
      labels[0].layoutSizingHorizontal = 'FILL';
      labels[0].layoutSizingVertical = 'HUG';
      labels[0].textAlignHorizontal = 'CENTER';
    }
    if (spec.effectStyle && ['FRAME', 'COMPONENT'].includes(node.type))
      node.clipsContent = true;
    if (spec.type === 'FRAME') {
      const expected = [];
      for (const child of spec.children || []) {
        const childKey = `${key}/${child.id || child.key}`;
        const childNode = await treeNode(child, node, component, childKey);
        expected.push(childNode);
      }
      const decorations = await focusDecorations(spec, node, key);
      expected.unshift(...decorations);
      expected.forEach((child, index) => {
        if (node.children[index] !== child) node.insertChild(index, child);
      });
      // Retain user-owned additions. Report obsolete importer-owned children for review.
      for (const child of node.children) {
        if (mgReadIdentity(child, MG_KIT_KEY) && !expected.includes(child))
          result.audit.push({
            nodeId: child.id,
            status: 'retained-obsolete-child',
            key: mgReadIdentity(child, MG_KIT_KEY),
          });
      }
    }
    return node;
  }
  const surviving = ready.filter(family => {
    let failure;
    for (const variant of family.variants)
      treeWalk(variant.tree, tree => {
        if (
          tree.textStyle &&
          (!localText.has(tree.textStyle) || failedStyleIds.has(tree.textStyle))
        )
          failure = `Missing text style ${tree.textStyle}`;
        if (
          tree.effectStyle &&
          (!localEffects.has(tree.effectStyle) ||
            failedStyleIds.has(tree.effectStyle))
        )
          failure = `Missing effect style ${tree.effectStyle}`;
      });
    if (failure) {
      blocked.add(family.id);
      result.errors.push(`${family.name}: ${failure}`);
      result.audit.push({
        family: family.id,
        status: 'blocked',
        reason: failure,
      });
    }
    return !failure;
  });
  if (!surviving.length) return result;
  function container(key, name, width) {
    let frame = owned.get(key);
    if (frame && frame.type !== 'FRAME')
      throw new Error(`${name} has changed type.`);
    const fresh = !frame;
    frame = frame || figma.createFrame();
    mark(frame, key, fresh);
    if (frame.parent !== page) page.appendChild(frame);
    frame.name = name;
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'FIXED';
    frame.resize(width, Math.max(frame.height, 100));
    frame.paddingTop =
      frame.paddingBottom =
      frame.paddingLeft =
      frame.paddingRight =
        32;
    frame.itemSpacing = 32;
    frame.clipsContent = false;
    frame.fills = [];
    if (fresh) {
      const right = Math.max(
        0,
        ...page.children
          .filter(item => item !== frame)
          .map(item => item.x + item.width)
      );
      frame.x = right + 160;
      frame.y = 160;
    }
    if (frame.explicitVariableModes[collection.id] !== mode.modeId)
      frame.setExplicitVariableModeForCollection(collection, mode.modeId);
    return frame;
  }
  const main = container('main', 'Mangrove / Main components', 1200);
  const review = container('review', 'Mangrove / Review', 800);
  result.reviewRootId = review.id;
  paint(review, 'fills', 'color/neutral-0');

  for (const family of surviving) {
    if (dependencies(family).some(id => !built.has(id))) {
      result.errors.push(`${family.name}: a dependent family did not build.`);
      continue;
    }
    const familyNew = [];
    try {
      const familyKey = `family/${family.id}`;
      let set = owned.get(familyKey);
      let pendingFirst;
      if (!set) {
        pendingFirst = figma.createComponent();
        const first = family.variants[0];
        pendingFirst.name = first.name;
        mark(pendingFirst, `${familyKey}/variant/${first.id}`, true);
        familyNew.push(pendingFirst);
        main.appendChild(pendingFirst);
        set = figma.combineAsVariants([pendingFirst], main);
        mark(set, familyKey, true);
        familyNew.push(set);
      } else mark(set, familyKey, false);
      set.name = family.name;
      set.description =
        family.description ||
        `Reusable ${family.name} controls. Source: ${sourceLabel(family)}`;
      set.layoutMode = 'NONE';
      set.clipsContent = false;
      set.fills = [];
      for (const [name, property] of Object.entries(
        family.optionalProperties || {}
      ))
        ensureProperty(set, name, 'BOOLEAN', property.defaultValue);
      const variants = [];
      for (const recipe of family.variants) {
        const key = `${familyKey}/variant/${recipe.id}`;
        let component = owned.get(key);
        if (component && component.type !== 'COMPONENT')
          throw new Error(`Variant ${key} changed type.`);
        if (!component) {
          component = figma.createComponent();
          mark(component, key, true);
          familyNew.push(component);
        }
        if (component.parent !== set) set.appendChild(component);
        component.name =
          recipe.name ||
          Object.entries(recipe.properties)
            .map(([name, value]) => `${name}=${value}`)
            .join(', ');
        component.description =
          family.description || `Source: ${sourceLabel(family)}`;
        await treeNode(recipe.tree, set, component, key, component);
        // Tree labels are useful internally; the root name must encode variants.
        component.name =
          recipe.name ||
          Object.entries(recipe.properties)
            .map(([name, value]) => `${name}=${value}`)
            .join(', ');
        variants.push({ node: component, recipe });
      }
      // Scoped connector batches retain prior variants. Include every retained
      // component in the main grid so later batches cannot overlap them.
      const layoutVariants = set.children.filter(
        node => node.type === 'COMPONENT'
      );
      const columns = Math.min(3, layoutVariants.length);
      const cellWidth =
        Math.max(...layoutVariants.map(node => node.width)) + 48;
      const cellHeight =
        Math.max(...layoutVariants.map(node => node.height)) + 48;
      layoutVariants.forEach((node, index) => {
        node.x = 24 + (index % columns) * cellWidth;
        node.y = 24 + Math.floor(index / columns) * cellHeight;
      });
      set.resizeWithoutConstraints(
        24 + columns * cellWidth,
        24 + Math.ceil(layoutVariants.length / columns) * cellHeight
      );
      built.set(family.id, { set, variants });
      result.families.push({
        id: family.id,
        setId: set.id,
        variantIds: variants.map(item => ({
          id: item.recipe.id,
          nodeId: item.node.id,
        })),
        propertyIds: Object.keys(set.componentPropertyDefinitions),
      });
      result.audit.push({
        family: family.id,
        status: 'built',
        variantCount: variants.length,
      });
    } catch (error) {
      result.errors.push(`${family.name}: ${reportError(error)}`);
      result.audit.push({
        family: family.id,
        status: 'failed',
        reason: reportError(error),
        existingChangesRetained: !familyNew.some(
          node => node.type === 'COMPONENT_SET'
        ),
      });
      // Remove only objects created by this failed family, never existing components.
      for (const node of familyNew.reverse()) {
        if (!node.removed) {
          if ('findAll' in node)
            node
              .findAll(() => true)
              .forEach(child => {
                created.delete(child.id);
                updated.delete(child.id);
              });
          created.delete(node.id);
          updated.delete(node.id);
          node.remove();
        }
      }
      for (const [key, node] of owned)
        if (node.removed) {
          owned.delete(key);
          created.delete(node.id);
          updated.delete(node.id);
        }
    }
  }

  const reviewPadding = 8;
  async function reviewFrame(key, name, parent, width) {
    let frame = owned.get(key);
    const fresh = !frame;
    if (frame && frame.type !== 'FRAME')
      throw new Error(`Review node ${key} changed type.`);
    frame = frame || figma.createFrame();
    mark(frame, key, fresh);
    if (frame.parent !== parent) parent.appendChild(frame);
    frame.name = name;
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'FIXED';
    frame.resize(width, Math.max(frame.height, 40));
    frame.paddingTop =
      frame.paddingBottom =
      frame.paddingLeft =
      frame.paddingRight =
        reviewPadding;
    frame.itemSpacing = 12;
    frame.clipsContent = false;
    frame.fills = [];
    return frame;
  }
  async function reviewLabel(key, text, parent) {
    let node = owned.get(key);
    const fresh = !node;
    if (node && node.type !== 'TEXT')
      throw new Error(`Review label ${key} changed type.`);
    node = node || figma.createText();
    mark(node, key, fresh);
    await loadNodeFonts(node);
    if (node.parent !== parent) parent.appendChild(node);
    const fontFamily = variable('font-family/text', 'STRING');
    const font = {
      family: fontFamily.resolveForConsumer(parent).value,
      style: 'Regular',
    };
    await load(font);
    node.fontName = font;
    node.setBoundVariable('fontFamily', fontFamily);
    bind(node, 'fontSize', 'font-size/300');
    node.textAutoResize = 'HEIGHT';
    node.characters = text;
    node.resize(
      Math.max(1, parent.width - parent.paddingLeft - parent.paddingRight),
      Math.max(1, node.height)
    );
    node.layoutSizingHorizontal = 'FILL';
    node.layoutSizingVertical = 'HUG';
    node.name = text;
    paint(node, 'fills', 'color/neutral-900');
    return node;
  }
  for (const [id, family] of built) {
    if (!chosen.has(id)) continue;
    try {
      const reviewOptions = families.get(id)?.review || {};
      const section = await reviewFrame(
        `review/${id}`,
        family.set.name,
        review,
        736
      );
      await reviewLabel(`review/${id}/title`, family.set.name, section);
      const grid = await reviewFrame(
        `review/${id}/grid`,
        'States and resizing examples',
        section,
        720
      );
      grid.layoutMode = 'HORIZONTAL';
      grid.layoutWrap = 'WRAP';
      grid.resize(720, grid.height);
      grid.primaryAxisSizingMode = 'FIXED';
      grid.counterAxisSizingMode = 'AUTO';
      grid.itemSpacing = 16;
      grid.counterAxisSpacing = 16;
      grid.primaryAxisAlignItems = 'MIN';
      grid.counterAxisAlignItems = 'MIN';
      const specimens = family.variants.map(item => ({
        id: item.recipe.id,
        name: item.recipe.name,
        variant: item,
        width:
          reviewOptions.width ||
          (typeof item.recipe.tree.layout?.width === 'number'
            ? item.recipe.tree.layout.width
            : undefined),
      }));
      if (reviewOptions.genericLabels !== false)
        specimens.push({
          id: 'long-label',
          name: 'Long label, editable instance',
          variant: family.variants[0],
          label: 'A longer Mangrove label to check resizing and wrapping',
        });
      if (reviewOptions.genericLabels !== false)
        specimens.push({
          id: 'narrow',
          name: 'Narrow layout, 240px',
          variant: family.variants[0],
          width: 240,
          label: 'A longer Mangrove label in a narrow layout',
        });
      specimens.push(
        ...(reviewOptions.specimens || []).map(specimen => ({
          ...specimen,
          variant: family.variants.find(item =>
            matches(item.recipe.properties, specimen.variant)
          ),
        }))
      );
      for (const specimen of specimens) {
        const key = `review/${id}/specimen/${specimen.id}`;
        const row = await reviewFrame(
          key,
          specimen.name,
          grid,
          specimen.width
            ? specimen.width + 2 * reviewPadding
            : specimen.label
              ? 704
              : 344
        );
        await reviewLabel(`${key}/caption`, specimen.name, row);
        let instance = owned.get(`${key}/instance`);
        const fresh = !instance;
        if (instance && instance.type !== 'INSTANCE')
          throw new Error(`Review instance ${key} changed type.`);
        if (!instance) instance = specimen.variant.node.createInstance();
        mark(instance, `${key}/instance`, fresh);
        await loadNodeFonts(instance);
        if (instance.parent !== row) row.appendChild(instance);
        if (fresh) {
          instance.name = specimen.name;
          let labelTarget = instance;
          if (specimen.label)
            for (const name of reviewOptions.longLabelTarget || []) {
              const matches = labelTarget.children.filter(
                child => child.name === name
              );
              if (matches.length !== 1)
                throw new Error(
                  `Ambiguous or missing review label target ${name}`
                );
              labelTarget = matches[0];
            }
          const label = Object.entries(labelTarget.componentProperties).find(
            ([name, property]) =>
              property.type === 'TEXT' &&
              name.replace(/#[^#]+$/, '') === 'Label'
          );
          if (label && specimen.label) {
            labelTarget.setProperties({ [label[0]]: specimen.label });
            if (labelTarget !== instance) created.add(labelTarget.id);
          } else if (specimen.label)
            throw new Error(
              `Review label property missing on ${labelTarget.name}`
            );
          const overrides = {};
          for (const [name, value] of Object.entries(
            specimen.properties || {}
          )) {
            const entry = Object.entries(instance.componentProperties).find(
              ([key]) => key.replace(/#[^#]+$/, '') === name
            );
            if (
              !entry ||
              (entry[1].type === 'TEXT'
                ? typeof value !== 'string'
                : entry[1].type !== 'BOOLEAN' || typeof value !== 'boolean')
            )
              throw new Error(
                `Review property ${name} must match a named TEXT or BOOLEAN property.`
              );
            overrides[entry[0]] = value;
          }
          if (Object.keys(overrides).length) instance.setProperties(overrides);
          if (
            specimen.width ||
            specimen.variant.recipe.tree.layout?.width === 'FILL'
          )
            instance.layoutSizingHorizontal = 'FILL';
          if (specimen.instanceWidth !== undefined)
            applyLayout(instance, { width: specimen.instanceWidth });
          // Apply content before geometry, then resolve fresh descendants again.
          // Nested property changes can rebuild instance descendants in Figma.
        }
        if (specimen.nodes?.length && (fresh || refreshNarrowReview)) {
          if (!fresh) {
            const current = await instance.getMainComponentAsync();
            if (current?.id !== specimen.variant.node.id) {
              instance.swapComponent(specimen.variant.node);
              await loadNodeFonts(instance);
            }
          }
          applyLayout(instance, {
            width: specimen.instanceWidth ?? specimen.width,
            height: 'HUG',
          });
          for (const seed of fresh ? specimen.nodes : []) {
            let target = instance;
            for (const name of seed.path) {
              const children = target.children.filter(
                child => child.name === name
              );
              if (children.length !== 1)
                throw new Error(`Ambiguous or missing review node ${name}`);
              target = children[0];
            }
            await loadNodeFonts(target);
            const values = {};
            for (const [name, value] of Object.entries(seed.properties || {})) {
              const property = Object.keys(target.componentProperties).find(
                key => key.replace(/#[^#]+$/, '') === name
              );
              if (!property)
                throw new Error(
                  `Review nested property ${name} is unavailable.`
                );
              values[property] = value;
            }
            if (Object.keys(values).length) target.setProperties(values);
            created.add(target.id);
          }
          if (!fresh)
            result.audit.push({
              nodeId: instance.id,
              status: 'composed-review-geometry-refreshed',
              preservedContent: true,
            });
        }
        if (!fresh && specimen.label && reviewOptions.longLabelTarget) {
          result.audit.push({
            nodeId: instance.id,
            status: 'existing-nested-review-label-preserved',
            anatomyPath: reviewOptions.longLabelTarget,
            note: 'Nested label seeding applies to fresh review specimens only. Existing labels are preserved; use the exposed nested Label property to edit a prior specimen or explicitly reseed the review.',
          });
        }
        if (
          Number.isFinite(specimen.width) &&
          specimen.width > 0 &&
          reviewOptions.responsiveLabel &&
          (fresh || (refreshNarrowReview && id === 'button'))
        ) {
          const label = instance
            .findAllWithCriteria({ types: ['TEXT'] })
            .find(
              node =>
                node.componentPropertyReferences?.characters?.replace(
                  /#[^#]+$/,
                  ''
                ) === 'Label'
            );
          if (label) {
            await loadNodeFonts(label);
            instance.resize(specimen.width, Math.max(1, instance.height));
            instance.layoutSizingHorizontal = 'FILL';
            instance.layoutSizingVertical = 'HUG';
            label.textAutoResize = 'HEIGHT';
            label.textAlignHorizontal = 'CENTER';
            label.resize(
              Math.max(
                1,
                instance.width - instance.paddingLeft - instance.paddingRight
              ),
              Math.max(1, label.height)
            );
            label.layoutSizingHorizontal = 'FILL';
            label.layoutSizingVertical = 'HUG';
            if (fresh) created.add(label.id);
            else updated.add(label.id);
            if (!fresh)
              result.audit.push({
                nodeId: instance.id,
                labelNodeId: label.id,
                status: 'narrow-review-layout-refreshed',
                width: specimen.width,
                preservedLabel: true,
              });
          }
        }
        // Existing labels remain editable, including during explicit layout refresh.
      }
    } catch (error) {
      result.errors.push(`Review ${family.set.name}: ${reportError(error)}`);
    }
  }
  result.createdNodeIds = [...created];
  result.updatedNodeIds = [...updated];
  if (result.families.length) figma.viewport.scrollAndZoomIntoView([review]);
  return result;
}
