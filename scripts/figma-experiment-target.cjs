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
  const insertions = entryNames.map(name => {
    const matches = ast.program.body.filter(
      node => node.type === 'FunctionDeclaration' && node.id?.name === name
    );
    if (matches.length !== 1 || !matches[0].async)
      throw new Error(`Experiment needs exactly one async ${name} entry.`);
    return matches[0].body.start + 1;
  });
  const check = `mgAssertExperimentTarget(figma, ${JSON.stringify(fileKey)}, ${JSON.stringify(PROTECTED_FILES)});`;
  let guarded = source;
  for (const index of insertions.sort((a, b) => b - a))
    guarded = guarded.slice(0, index) + check + guarded.slice(index);
  return `const mgAssertExperimentTarget = ${assertExperimentTarget.toString()};\n${check}\n${guarded}`;
}

module.exports = {
  PROTECTED_FILES,
  validateExperimentFileKey,
  guardExperimentSource,
};
