/**
 * Custom ESLint rules for this workspace.
 * Exported as a rules map for @nx/eslint-plugin/resolve-workspace-rules.
 */

const noRawMarginLeftRight = require('./no-raw-margin-left-right.js');

module.exports = {
  rules: {
    'no-raw-margin-left-right': noRawMarginLeftRight,
  },
};
