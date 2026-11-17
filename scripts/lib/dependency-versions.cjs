/** Validate framework versions in the parsed Yarn lockfile, including nested copies. */
function checkDependencyVersions(lock) {
  const versions = new Map();
  for (const record of Object.values(lock)) {
    const name = record?.resolution?.match(/^(@[^/]+\/[^@]+|[^@]+)@/)?.[1];
    if (!name || typeof record.version !== 'string') continue;
    if (!versions.has(name)) versions.set(name, new Set());
    versions.get(name).add(record.version);
  }

  const errors = [];
  const singleVersion = name => {
    const found = [...(versions.get(name) || [])].sort();
    if (found.length !== 1) {
      errors.push(
        `${name}: expected one locked version, found ${found.join(', ') || 'none'}.`
      );
      return undefined;
    }
    return found[0];
  };

  const react = singleVersion('react');
  const reactDom = singleVersion('react-dom');
  if (react && reactDom && react !== reactDom)
    errors.push(`React (${react}) and React DOM (${reactDom}) must match.`);

  const storybook = singleVersion('storybook');
  // These two support packages have independent release/version schedules.
  const independentPackages = new Set([
    '@storybook/global',
    '@storybook/icons',
  ]);
  if (storybook) {
    for (const [name, found] of versions) {
      if (
        !independentPackages.has(name) &&
        (name.startsWith('@storybook/') ||
          name === 'create-storybook' ||
          name === 'eslint-plugin-storybook') &&
        [...found].some(version => version !== storybook)
      ) {
        errors.push(
          `${name}: locked ${[...found].sort().join(', ')}; align with storybook ${storybook}.`
        );
      }
    }
  }
  return errors;
}

module.exports = { checkDependencyVersions };
