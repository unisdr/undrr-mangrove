'use strict';

const { parse } = require('@babel/parser');
const PROTECTED_FILES = Object.freeze([
  'Zgjq8pQ0FMT8d6dhw9M5bt',
  'wOTLILmiXUI3uzG2BdPUxB',
  'JF29fJWi9LzUHeOObGL3nB',
]);

function validateExperimentFileKey(fileKey) {
  if (
    typeof fileKey !== 'string' ||
    !/^[A-Za-z0-9]{20,64}$/.test(fileKey) ||
    PROTECTED_FILES.includes(fileKey)
  )
    throw new Error(
      'Experiment requires an exact separate unpublished file key.'
    );
  return fileKey;
}

// The key is read afresh at each entry. The guard never creates a fallback key,
// uses a document name as identity or changes the supplied Plugin API object.
function assertExperimentTarget(figmaApi, expectedKey, protectedKeys) {
  const actualKey = figmaApi.fileKey;
  if (
    typeof actualKey !== 'string' ||
    protectedKeys.includes(actualKey) ||
    actualKey !== expectedKey
  )
    throw new Error('Experiment target refused before mutation.');
}

function guardExperimentSource(source, fileKey, entryNames) {
  validateExperimentFileKey(fileKey);
  if (
    !Array.isArray(entryNames) ||
    !entryNames.length ||
    new Set(entryNames).size !== entryNames.length ||
    entryNames.some(
      name => !['importVariables', 'buildMangroveComponents'].includes(name)
    )
  )
    throw new Error(
      'Experiment guard accepts only bounded import/build entries.'
    );
  const ast = parse(source, {
    sourceType: 'script',
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
  });
  const reserved = new Set([
    'mgAssertExperimentTarget',
    'mgAssertExperimentOperationTarget',
  ]);
  function binding(pattern) {
    if (!pattern) return;
    if (pattern.type === 'Identifier' && reserved.has(pattern.name))
      throw new Error(`Experiment guard binding collision: ${pattern.name}`);
    if (pattern.type === 'RestElement') binding(pattern.argument);
    if (pattern.type === 'AssignmentPattern') binding(pattern.left);
    if (pattern.type === 'ArrayPattern') pattern.elements.forEach(binding);
    if (pattern.type === 'ObjectPattern')
      pattern.properties.forEach(p =>
        binding(p.type === 'RestElement' ? p.argument : p.value)
      );
  }
  function inspect(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclarator') binding(node.id);
    if (
      [
        'FunctionDeclaration',
        'FunctionExpression',
        'ArrowFunctionExpression',
      ].includes(node.type)
    ) {
      binding(node.id);
    }
    // Babel method nodes have parameters too, without a function declaration ID.
    if (Array.isArray(node.params)) node.params.forEach(binding);
    if (['ClassDeclaration', 'ClassExpression'].includes(node.type))
      binding(node.id);
    if (node.type === 'CatchClause') binding(node.param);
    for (const value of Object.values(node))
      if (Array.isArray(value)) value.forEach(inspect);
      else if (value && typeof value === 'object') inspect(value);
  }
  inspect(ast.program);
  const insertions = entryNames.map(name => {
    const matches = ast.program.body.filter(
      node => node.type === 'FunctionDeclaration' && node.id?.name === name
    );
    if (matches.length !== 1 || !matches[0].async)
      throw new Error(`Experiment needs exactly one async ${name} entry.`);
    return matches[0].body.start + 1;
  });
  const check = 'mgAssertExperimentOperationTarget();';
  let guarded = source;
  for (const index of insertions.sort((a, b) => b - a))
    guarded = guarded.slice(0, index) + check + guarded.slice(index);
  const hook = `const mgAssertExperimentOperationTarget = () => mgAssertExperimentTarget(figma, ${JSON.stringify(fileKey)}, ${JSON.stringify(PROTECTED_FILES)});`;
  return `const mgAssertExperimentTarget = ${assertExperimentTarget.toString()};\n${hook}\n${check}\n${guarded}`;
}

module.exports = {
  PROTECTED_FILES,
  validateExperimentFileKey,
  guardExperimentSource,
};
