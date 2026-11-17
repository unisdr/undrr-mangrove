/** @jest-environment node */
const { checkDependencyVersions } = require('../lib/dependency-versions.cjs');

function fixture(entries = {}) {
  return Object.fromEntries(
    Object.entries({
      react: ['19.3.1'],
      'react-dom': ['19.3.1'],
      storybook: ['10.6.3'],
      '@storybook/cli': ['10.6.3'],
      '@storybook/addon-vitest': ['10.6.3'],
      '@storybook/global': ['5.0.0'],
      '@storybook/icons': ['2.0.2'],
      ...entries,
    }).flatMap(([name, versions]) =>
      versions.map(version => [
        `${name}@npm:${version}`,
        { version, resolution: `${name}@npm:${version}` },
      ])
    )
  );
}

test('accepts aligned frameworks and independently versioned Storybook helpers', () => {
  expect(checkDependencyVersions(fixture())).toEqual([]);
});

test('rejects an old nested React copy even when the root version is current', () => {
  expect(
    checkDependencyVersions(fixture({ react: ['19.3.0', '19.3.1'] }))
  ).toContain('react: expected one locked version, found 19.3.0, 19.3.1.');
});

test('rejects different React and React DOM versions', () => {
  expect(
    checkDependencyVersions(fixture({ 'react-dom': ['19.3.0'] }))
  ).toContain('React (19.3.1) and React DOM (19.3.0) must match.');
});

test('rejects missing framework lockfile records', () => {
  expect(checkDependencyVersions(fixture({ storybook: [] }))).toContain(
    'storybook: expected one locked version, found none.'
  );
});

test('rejects the old Storybook core left by a nested CLI dependency', () => {
  expect(
    checkDependencyVersions(fixture({ storybook: ['10.6.1', '10.6.3'] }))
  ).toContain('storybook: expected one locked version, found 10.6.1, 10.6.3.');
});

test.each([
  '@storybook/cli',
  '@storybook/addon-vitest',
  'eslint-plugin-storybook',
])('rejects %s out of alignment with the core', name => {
  expect(
    checkDependencyVersions(fixture({ [name]: ['10.6.1', '10.6.3'] }))
  ).toContain(`${name}: locked 10.6.1, 10.6.3; align with storybook 10.6.3.`);
});
