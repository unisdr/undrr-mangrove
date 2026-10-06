/** Opt-in source line copy ownership. Pure reads, no formatting/layout writes. */
var mgFrozenSourceLine = (function () {
  'use strict';
  function fail(message) {
    throw new Error('Frozen source line preflight: reflow-needed: ' + message);
  }
  function object(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }
  function sourcePlans(records) {
    if (!Array.isArray(records)) fail('Invalid source record list');
    const plans = [],
      groups = new Map(),
      keys = new Set();
    for (const record of records) {
      if (!object(record) || !object(record.spec))
        fail('Invalid source record');
      const spec = record.spec;
      if (!Object.prototype.hasOwnProperty.call(spec, 'sourceLine')) continue;
      const line = spec.sourceLine;
      if (
        !object(line) ||
        Object.keys(line).sort().join(',') !==
          'end,lineCount,lineIndex,paragraphCharacters,paragraphId,start' ||
        spec.type !== 'TEXT' ||
        typeof spec.characters !== 'string' ||
        !spec.characters.length ||
        /[\r\n]/.test(spec.characters) ||
        typeof record.key !== 'string' ||
        !record.key ||
        typeof record.ownerKey !== 'string' ||
        !record.ownerKey ||
        !record.key.startsWith(record.ownerKey + '/') ||
        keys.has(record.key)
      )
        fail('Invalid source identity/profile');
      if (
        typeof line.paragraphId !== 'string' ||
        !line.paragraphId ||
        typeof line.paragraphCharacters !== 'string' ||
        !line.paragraphCharacters.length ||
        ['start', 'end', 'lineIndex', 'lineCount'].some(
          k => !Number.isInteger(line[k])
        ) ||
        line.start < 0 ||
        line.end <= line.start ||
        line.end > line.paragraphCharacters.length ||
        line.lineIndex < 0 ||
        line.lineCount < 1 ||
        line.lineCount > 64 ||
        line.lineIndex >= line.lineCount ||
        line.paragraphCharacters.slice(line.start, line.end) !== spec.characters
      )
        fail('Invalid paragraph offsets/copy');
      if (
        spec.textProperty ||
        spec.bindings?.characters ||
        spec.componentPropertyReferences ||
        spec.layout?.width !== 'HUG' ||
        spec.layout?.height !== 'HUG' ||
        spec.textAutoResize ||
        spec.maxLines
      )
        fail('Conflicting line reset/layout contract');
      keys.add(record.key);
      const plan = Object.freeze({
        key: record.key,
        ownerKey: record.ownerKey,
        paragraphId: line.paragraphId,
        paragraphCharacters: line.paragraphCharacters,
        lineIndex: line.lineIndex,
        lineCount: line.lineCount,
        start: line.start,
        end: line.end,
        characters: spec.characters,
      });
      plans.push(plan);
      const groupKey = record.ownerKey + '\n' + line.paragraphId;
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(plan);
    }
    for (const group of groups.values()) {
      group.sort((a, b) => a.lineIndex - b.lineIndex);
      const first = group[0];
      if (
        group.length !== first.lineCount ||
        group.some(
          (p, i) =>
            p.lineIndex !== i ||
            p.lineCount !== first.lineCount ||
            p.paragraphCharacters !== first.paragraphCharacters ||
            p.start !== (i ? group[i - 1].end : 0)
        ) ||
        group[group.length - 1].end !== first.paragraphCharacters.length ||
        group.map(p => p.characters).join('') !== first.paragraphCharacters
      )
        fail('Missing/duplicate/overlapping source paragraph lines');
    }
    return Object.freeze(plans);
  }
  function descendants(root) {
    const out = [];
    function visit(node) {
      out.push(node);
      if ('children' in node) for (const child of node.children) visit(child);
    }
    visit(root);
    return out;
  }
  function nearestOwner(node) {
    for (let parent = node.parent; parent; parent = parent.parent)
      if (parent.type === 'COMPONENT' || parent.type === 'INSTANCE')
        return parent;
    return null;
  }
  async function preflight(plans, native) {
    if (!plans.length)
      return Object.freeze({
        checkedMainNodeIds: [],
        checkedInstanceNodeIds: [],
      });
    if (
      !object(native) ||
      typeof native.mainByKey !== 'function' ||
      typeof native.identity !== 'function' ||
      typeof native.mainForInstance !== 'function' ||
      !Array.isArray(native.instances)
    )
      fail('Missing native ownership adapter');
    const checkedMainNodeIds = [],
      checkedInstanceNodeIds = [],
      mainCache = new Map(),
      instanceCache = new Map();
    const copies = [];
    const instanceIds = new Set();
    for (const instance of native.instances) {
      if (
        !instance ||
        instance.type !== 'INSTANCE' ||
        typeof instance.id !== 'string' ||
        !instance.id ||
        instanceIds.has(instance.id)
      )
        fail('Invalid/duplicate linked-instance candidate');
      instanceIds.add(instance.id);
    }
    for (const plan of plans) {
      if (!mainCache.has(plan.ownerKey)) {
        const matches = native.mainByKey(plan.ownerKey);
        if (!Array.isArray(matches) || matches.length > 1)
          fail('Invalid/duplicate main owner ' + plan.ownerKey);
        mainCache.set(plan.ownerKey, matches[0] || null);
      }
      const main = mainCache.get(plan.ownerKey);
      if (!main) continue;
      if (
        main.type !== 'COMPONENT' ||
        typeof main.id !== 'string' ||
        native.identity(main) !== plan.ownerKey
      )
        fail('Foreign main owner ' + plan.ownerKey);
      const own = descendants(main).filter(n => {
        const owner = nearestOwner(n);
        return (
          native.identity(n) === plan.key &&
          owner?.id === main.id &&
          owner.type === 'COMPONENT' &&
          native.identity(owner) === plan.ownerKey
        );
      });
      if (
        own.length !== 1 ||
        own[0].type !== 'TEXT' ||
        own[0].characters !== plan.characters
      )
        fail('Main line changed/missing/duplicate ' + plan.key);
      checkedMainNodeIds.push(own[0].id);
      copies.push({ node: own[0], owner: main, plan });
      for (const instance of native.instances) {
        if (instance.type !== 'INSTANCE')
          fail('Invalid linked-instance candidate');
        if (!instanceCache.has(instance.id))
          instanceCache.set(
            instance.id,
            await native.mainForInstance(instance)
          );
        const linked = instanceCache.get(instance.id);
        if (!linked || linked.id !== main.id) continue;
        if (
          linked.type !== 'COMPONENT' ||
          native.identity(linked) !== plan.ownerKey
        )
          fail('Ambiguous main relationship ' + instance.id);
        const texts = descendants(instance).filter(n => {
          const owner = nearestOwner(n);
          return (
            native.identity(n) === plan.key &&
            owner?.id === instance.id &&
            owner.type === 'INSTANCE'
          );
        });
        if (
          texts.length !== 1 ||
          texts[0].type !== 'TEXT' ||
          texts[0].characters !== plan.characters
        )
          fail(
            'Linked line changed/missing/duplicate ' +
              instance.id +
              '/' +
              plan.key
          );
        checkedInstanceNodeIds.push(texts[0].id);
        copies.push({ node: texts[0], owner: instance, plan });
      }
    }
    // A prior line can change while a later documented main relationship read awaits.
    for (const copy of copies) {
      const owner = nearestOwner(copy.node);
      if (
        copy.node.removed ||
        copy.owner.removed ||
        native.identity(copy.node) !== copy.plan.key ||
        owner?.id !== copy.owner.id ||
        owner.type !== copy.owner.type ||
        (owner.type === 'COMPONENT' &&
          native.identity(owner) !== copy.plan.ownerKey) ||
        copy.node.characters !== copy.plan.characters
      )
        fail('Line changed during ownership reads ' + copy.plan.key);
    }
    return Object.freeze({
      checkedMainNodeIds: Object.freeze(checkedMainNodeIds),
      checkedInstanceNodeIds: Object.freeze(checkedInstanceNodeIds),
    });
  }
  return Object.freeze({ sourcePlans, preflight });
})();
