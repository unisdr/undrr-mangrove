/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */

const config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // An array of file extensions your modules use
  moduleFileExtensions: [
    'jsx',
    'js',
    'mjs',
    'cjs',
    'ts',
    'tsx',
    'json',
    'node',
  ],

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // The regexp pattern or array of patterns that Jest uses to detect test files
  testRegex: ['(/__tests__/.*|\\.(test|spec))\\.(js|jsx)$'],

  // Build output contains copies of the source tree, including its test files.
  // Those copies compile against a flattened directory layout and fail, so
  // `yarn test` would break for anyone who had previously run `yarn build`.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/docs-build-temp/',
    // The Pages workflow renames docs-build-temp to _site before running tests.
    '/_site/',
    '/storybook-static/',
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '.+\\.(svg|css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$':
      'jest-transform-stub',
  },

  // Generated build output the suites depend on is not committed, so make
  // sure it exists before any suite runs. See jest.global-setup.cjs.
  globalSetup: '<rootDir>/jest.global-setup.cjs',

  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Mock CSS modules
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'jest-transform-stub',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': 'jest-transform-stub',
  },

  // Allow ES modules
  transformIgnorePatterns: ['node_modules/(?!core-js)'],

  // Coverage thresholds (ratchet up as coverage improves)
  coverageThreshold: {
    global: {
      statements: 10,
      branches: 10,
      functions: 10,
      lines: 10,
    },
  },
};

export default config;
