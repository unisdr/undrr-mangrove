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

    "jsx",

    "js",

    "mjs",

    "cjs",

    "ts",

    "tsx",

    "json",

    "node"

  ],

  // The test environment that will be used for testing

  testEnvironment: "jsdom",

  // The regexp pattern or array of patterns that Jest uses to detect test files

  testRegex: ["(/__tests__/.*|\\.(test|spec))\\.(js|jsx)$"],

  // A map from regular expressions to paths to transformers

  transform: {

    "^.+\\.(js|jsx)$": "babel-jest",

    ".+\\.(svg|css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$": "jest-transform-stub",

  },

};

module.exports = config;
