"use strict";

const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    ignores: ["node_modules/**", "database/**", "public/**"],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-console": "off",
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-throw-literal": "error",
    },
  },
  {
    // Playwright scripts: callbacks passed to page.evaluate run in the browser.
    files: ["scripts/**/*.js", "test/browser/**/*.js"],
    languageOptions: {
      globals: { ...globals.browser, jQuery: "readonly" },
    },
  },
];
