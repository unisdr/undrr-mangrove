import ts from 'typescript';

/**
 * Select the component collection shared by catalog output and validation.
 * Quality stories exercise components; they are not consumer APIs. Keep them
 * in Storybook's raw manifest/routes, but out of the published AI catalog and
 * its PropTypes denominator. Do not alter or suppress ordinary story-only
 * documentation pages: they remain part of the library's existing catalog.
 */
export function selectPublishedComponents(components) {
  return Object.fromEntries(
    Object.entries(components).filter(([, component]) => {
      const source = component.path?.replaceAll('\\', '/');
      return !/^\.?\/?stories\/Quality\//.test(source || '');
    })
  );
}

/** PropTypes coverage of the same selected collection the catalog publishes. */
export function propTypesCoverage(components) {
  const total = Object.keys(components).length;
  const documented = Object.values(components).filter(
    component =>
      component.reactDocgen?.props &&
      Object.keys(component.reactDocgen.props).length > 0
  ).length;
  return {
    total,
    documented,
    percent: total > 0 ? Math.round((documented / total) * 100) : 0,
  };
}

function namedImportSource(node) {
  if (!node || !ts.isImportDeclaration(node)) return undefined;
  const clause = node.importClause;
  if (
    !clause?.namedBindings ||
    !ts.isNamedImports(clause.namedBindings) ||
    !clause.namedBindings.elements.length ||
    clause.namedBindings.elements.some(specifier => specifier.isTypeOnly) ||
    clause.name ||
    clause.isTypeOnly ||
    node.attributes ||
    !ts.isStringLiteral(node.moduleSpecifier)
  ) {
    return undefined;
  }
  return node.moduleSpecifier.text;
}

function removeGeneratedImports(snippet, packageName) {
  if (!snippet?.startsWith('import ') || !snippet.includes(packageName)) {
    return snippet;
  }

  const { statements } = ts.createSourceFile(
    'storybook-example.tsx',
    snippet,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX
  );
  const first = statements[0];
  if (namedImportSource(first) !== packageName) return snippet;

  let end = first.end;
  for (const statement of statements.slice(1)) {
    // The generated prelude also lists imports relative to the story file.
    // These paths cannot resolve for consumers copying catalogue examples.
    if (!/^\.\.?\//.test(namedImportSource(statement) ?? '')) break;
    end = statement.end;
  }
  const { diagnostics } = ts.transpileModule(snippet.slice(0, end), {
    reportDiagnostics: true,
  });
  return diagnostics?.length ? snippet : snippet.slice(end).trimStart();
}

/** Keep the published example set when Storybook v1 groups sibling stories. */
export function selectCatalogueExamples(
  component,
  navigation,
  { manifestVersion, packageName }
) {
  const primary = [];
  const siblings = [];
  for (const story of component.stories ?? []) {
    const destination =
      navigation[story.id]?.importPath === component.path ? primary : siblings;
    destination.push(story);
  }
  // Builder docgen already selects the primary file. With v1, only filter
  // when the index positively identifies primary stories. If metadata is
  // incomplete, retain the examples for that component.
  const indexedSiblings = siblings.every(
    story => navigation[story.id]?.importPath
  );
  const grouped =
    manifestVersion === 1 &&
    component.path &&
    primary.length &&
    siblings.length &&
    indexedSiblings;
  const stories = grouped ? primary : [...primary, ...siblings];
  return stories.map(({ name, snippet }) => {
    // For grouped stories v1 embeds a generated root import in each snippet.
    // The catalogue already publishes the valid bundle import separately.
    const code = grouped
      ? removeGeneratedImports(snippet, packageName)
      : snippet;
    return { name, ...(code ? { code } : {}) };
  });
}
