import react from 'eslint-plugin-react';
import spellcheck from 'eslint-plugin-spellcheck';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['**/glideslider.js', 'stories/assets/js/lib/*.js'],
  },
  {
    // Report unused eslint-disable directives, never act on them. `lint:js`
    // passes `--fix-type problem,suggestion,layout`, which omits `directive`,
    // so `--fix` cannot delete a suppression comment. The severity is `error`
    // rather than `warn` so a stale directive fails the build instead of
    // adding one line to a wall of warnings: every suppression in the tree is
    // either load-bearing or has been replaced with a plain comment that keeps
    // its explanation. See unisdr/undrr-mangrove#1226 and #1235.
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      // Enabled so the suppression in Tree.fromElement.js guards something
      // real: that file strips control characters from an href on purpose.
      'no-control-regex': 'error',
    },
  },
  ...compat.extends('plugin:storybook/recommended', 'plugin:mdx/recommended'),
  prettierConfig,
  {
    plugins: {
      react,
      spellcheck,
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      ecmaVersion: 12,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          mdx: true,
        },
      },
    },

    settings: {
      'mdx/code-blocks': true,
    },

    rules: {
      'import/prefer-default-export': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'off',
      camelcase: 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/role-has-required-aria-props': 'off',
      'jsx-a11y/control-has-associated-label': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/img-redundant-alt': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
      'no-mixed-operators': 'off',
      'jsx-a11y/role-supports-aria-props': 'off',
      'no-param-reassign': 'off',
      'react/jsx-first-prop-new-line': 'off',
      'no-restricted-globals': ['error', 'event', 'fdescribe'],
      'no-undef': 'off',
      'no-var': 'off',
      'no-plusplus': 'off',
      'no-shadow': 'off',
      // Off deliberately. Widening lint coverage to component `.jsx`
      // (unisdr/undrr-mangrove#1235) surfaced 25 `javascript:` literals, and
      // every one is a fixture: stories demonstrating an unsafe href and tests
      // asserting the component refuses to render it. Enabling the rule would
      // flag the test suite for testing the thing it is meant to test.
      'no-script-url': 'off',
      // Enabled at `warn` rather than left off. The rule reports 27 sites;
      // five already carry a suppression recording the DOMPurify sanitization
      // contract, and those now guard something real. The other 22 need a
      // per-site audit that does not belong in a lint-coverage change, so this
      // warns today instead of failing the build.
      //
      // 27 is not the size of the backlog. `dangerouslySetInnerHTML` appears
      // at 36 non-test sites; the rule only inspects lowercase DOM elements,
      // so every use on a component-valued tag — `<HeadingTag>` in Hero.jsx,
      // for example — is invisible to it. Treat a clean run as necessary, not
      // sufficient. The audit also has to cover ResultItem.jsx, where the
      // injected HTML is a search-API response rather than a caller's own
      // markup. See unisdr/undrr-mangrove#1235.
      'react/no-danger': 'warn',
      // Small enough backlogs that enabling them costs nothing, and each keeps
      // an existing suppression comment load-bearing.
      'no-bitwise': 'warn',
      'no-await-in-loop': 'warn',
      'prefer-rest-params': 'off',
      'class-methods-use-this': 'off',
      'block-scoped-var': 'off',
      'max-len': 'off',
      // Off, as it was before component `.jsx` was linted. 51 sites across 32
      // files render list items keyed by index, and picking a stable key is a
      // per-component judgement about the data each one receives, not a
      // mechanical fix. Turning it on here would add 50 warnings nobody reads.
      // Tracked separately rather than smuggled into a coverage change.
      'react/no-array-index-key': [0],
      // `null: 'ignore'` because eight of the twelve loose comparisons that
      // widening coverage surfaced are the `x != null` nullish check, which is
      // the idiom the components use on purpose. The rest were tightened.
      eqeqeq: ['warn', 'always', { null: 'ignore' }],
      enforceForClassFields: [0],
      'react/button-has-type': 'off',
      'no-empty-pattern': 'off',
      'no-sequences': 'off',
      'react/style-prop-object': 'off',
      'vars-on-top': 'off',
      'no-redeclare': 'off',
      'mdx/no-unused-expressions': 'off',
      'prefer-const': 'warn',
      'jsx-a11y/anchor-has-content': 'off',
      'import/no-unresolved': [0],
      'react/no-unescaped-entities': [0],
      'react-a11y-role-has-required-aria-props': [0],
      '@typescript-eslint/no-empty-interface': [0],
      'import/no-extraneous-dependencie': 'off',
      'react/jsx-props-no-spreading': 'off',
      'import/no-extraneous-dependencies': 'off',
      // `console.error` and `console.warn` are how a component reports a
      // failure it cannot recover from. Widening coverage found 32 such
      // statements: 21 in component code, and 11 in test files that save and
      // replace `console.error` to silence an expected React warning. The rule
      // still catches a stray `console.log` left behind after debugging, which
      // is what it is for — the one `console.log` in the tree's component code
      // is a `debug`-gated channel in CookieConsentBanner and carries an
      // explicit suppression. Note the reach: this block claims only story
      // files and `.jsx`, so `no-console` never applies to plain `.js`,
      // including the `scripts/` CLIs that print on purpose.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-return-assign': ['warn', 'always'],
      // `as-needed` rather than `never`: naming a function expression that is
      // assigned to a member or passed to `memo()` is what puts a useful frame
      // in a stack trace, and the name cannot be inferred in either position.
      'func-names': ['warn', 'as-needed'],
      'no-underscore-dangle': [0],
      'no-use-before-define': 'off',

      'react/jsx-no-duplicate-props': [
        1,
        {
          ignoreCase: false,
        },
      ],

      'linebreak-style': 'off',
      'prettier/prettier': 'error',
    },
    // Component `.jsx` sits alongside the story files it documents, and the
    // rule set above was written for exactly this kind of code, so both share
    // it. Storybook's checked-in JavaScript is first-party configuration and
    // preview code; in particular preview.js contains JSX, so it must use the
    // JSX parser options here rather than ESLint's plain-JS defaults. The
    // directory's HTML manager/preview shells are intentionally absent: they
    // are not JavaScript or TypeScript source and are outside the coverage
    // guard's explicit extension list. See unisdr/undrr-mangrove#1235.
    files: [
      '**/*.stories.@(js|jsx|mdx|mjs|cjs)',
      '**/*.jsx',
      '.storybook/**/*.{js,jsx,mjs,cjs}',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'prettier/prettier': 'error',
    },
  },
];
