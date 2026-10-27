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
