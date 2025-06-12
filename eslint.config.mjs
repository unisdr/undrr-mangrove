import react from "eslint-plugin-react";
import spellcheck from "eslint-plugin-spellcheck";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/glideslider.js", "stories/assets/js/lib/*.js"],
}, ...compat.extends("plugin:storybook/recommended", "plugin:mdx/recommended"), prettierConfig, {
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
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true,
                mdx: true,
            },
        },
    },

    settings: {
        "mdx/code-blocks": true,
    },

    rules: {
        "import/prefer-default-export": "off",
        "react/prop-types": "off",
        "no-unused-vars": "off",
        camelcase: "off",
        "jsx-a11y/label-has-associated-control": "off",
        "jsx-a11y/role-has-required-aria-props": "off",
        "jsx-a11y/control-has-associated-label": "off",
        "jsx-a11y/anchor-is-valid": "off",
        "jsx-a11y/img-redundant-alt": "off",
        "jsx-a11y/no-noninteractive-tabindex": "off",
        "no-mixed-operators": "off",
        "jsx-a11y/role-supports-aria-props": "off",
        "no-param-reassign": "off",
        "react/jsx-first-prop-new-line": "off",
        "no-restricted-globals": ["error", "event", "fdescribe"],
        "no-undef": "off",
        "no-var": "off",
        "no-plusplus": "off",
        "no-shadow": "off",
        "no-script-url": "off",
        "prefer-rest-params": "off",
        "class-methods-use-this": "off",
        "block-scoped-var": "off",
        "max-len": "off",
        "react/no-array-index-key": [0],
        eqeqeq: "off",
        enforceForClassFields: [0],
        "react/button-has-type": "off",
        "no-empty-pattern": "off",
        "no-sequences": "off",
        "react/style-prop-object": "off",
        "vars-on-top": "off",
        "no-redeclare": "off",
        "mdx/no-unused-expressions": "off",
        "prefer-const": "off",
        "jsx-a11y/anchor-has-content": "off",
        "import/no-unresolved": [0],
        "react/no-unescaped-entities": [0],
        "react-a11y-role-has-required-aria-props": [0],
        "@typescript-eslint/no-empty-interface": [0],
        "import/no-extraneous-dependencie": "off",
        "react/jsx-props-no-spreading": "off",
        "import/no-extraneous-dependencies": "off",
        "no-console": "off",
        "no-return-assign": ["warn", "always"],
        "func-names": ["warn", "never"],
        "no-underscore-dangle": [0],
        "no-use-before-define": "off",

        "react/jsx-no-duplicate-props": [1, {
            ignoreCase: false,
        }],

        "linebreak-style": "off",
        "prettier/prettier": "error",
    },
    files: ["**/*.stories.@(js|jsx|mdx|mjs|cjs)"],
},
{
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaFeatures: {
                jsx: true
            },
            ecmaVersion: 12,
            sourceType: "module",
            project: "./tsconfig.json"
        }
    },
    plugins: {
        "@typescript-eslint": tseslint,
        prettier
    },
    rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "warn",
        "prettier/prettier": "error"
    }
}];