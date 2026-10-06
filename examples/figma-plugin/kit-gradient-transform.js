/** Construction-time gradient matrices. Live mode repaint is not a binding. */
'use strict';
const mgGradientTransform = (() => {
  const fail = message => {
    throw new Error('Gradient transform: ' + message);
  };
  const matrix = value =>
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(row => Array.isArray(row) && row.length === 3);
  function validate(layer) {
    if (
      !matrix(layer.transform) ||
      layer.transform.some(row => row.some(value => !Number.isFinite(value))) ||
      !matrix(layer.transformVariables) ||
      layer.transformVariables.some(row =>
        row.some(
          value => value !== null && (typeof value !== 'string' || !value)
        )
      )
    )
      fail('finite fallback and sparse 2x3 FLOAT role matrix required.');
    invertible(layer.transform);
  }
  function invertible(value) {
    const determinant = value[0][0] * value[1][1] - value[0][1] * value[1][0];
    if (!Number.isFinite(determinant) || determinant === 0)
      fail('matrix must be finite and invertible.');
  }
  function resolve(layer, number) {
    validate(layer);
    const result = layer.transform.map((row, i) =>
      row.map((fallback, j) => {
        const role = layer.transformVariables[i][j];
        const value = role === null ? fallback : number(role);
        if (!Number.isFinite(value))
          fail('resolved FLOAT entry must be finite.');
        return value;
      })
    );
    invertible(result);
    return result;
  }
  function source(doc, layer) {
    validate(layer);
    const ids = new Set();
    function number(name, mode, visiting = new Set()) {
      const matches = doc.variables.filter(entry => entry.name === name);
      const entry = matches[0];
      if (
        matches.length !== 1 ||
        typeof entry.id !== 'string' ||
        !entry.id ||
        entry.type !== 'FLOAT' ||
        doc.variables.filter(value => value.id === entry.id).length !== 1 ||
        visiting.has(entry.id)
      )
        fail('missing, ambiguous, wrong-typed or cyclic source role ' + name);
      visiting.add(entry.id);
      ids.add(entry.id);
      const value = entry.values?.[mode];
      if (value && typeof value === 'object') {
        if (
          Object.keys(value).join(',') !== 'alias' ||
          typeof value.alias !== 'string' ||
          !value.alias
        )
          fail('invalid source alias ' + name);
        return number(value.alias, mode, visiting);
      }
      if (!Number.isFinite(value))
        fail(
          'source FLOAT must exist and be finite in every source mode: ' +
            name +
            '/' +
            mode
        );
      return value;
    }
    if (!Array.isArray(doc.modes) || !doc.modes.length)
      fail('source modes required.');
    for (const mode of doc.modes) resolve(layer, name => number(name, mode.id));
    return [...ids];
  }
  return { validate, resolve, source };
})();
