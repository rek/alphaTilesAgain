'use strict';
/**
 * Unit tests for the no-raw-margin-left-right ESLint rule.
 * Uses ESLint's RuleTester (flat config format — ESLint 9+).
 *
 * See tasks.md §7.4 and design.md §D6.
 */

const { RuleTester } = require('eslint');
const rule = require('./no-raw-margin-left-right');

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

tester.run('no-raw-margin-left-right', rule, {
  valid: [
    // Logical props — must pass
    { code: 'const s = { marginStart: 16 };' },
    { code: 'const s = { marginEnd: 8 };' },
    { code: 'const s = { paddingStart: 4 };' },
    { code: 'const s = { paddingEnd: 12 };' },
    { code: 'const s = { margin: 16, padding: 8, borderRadius: 4 };' },

    // Allowlisted file path — util-theme itself may use any keys
    {
      code: 'const s = { marginLeft: 16 };',
      filename: '/repo/libs/shared/util-theme/src/lib/someFile.ts',
    },
    {
      code: 'const s = { paddingRight: 8 };',
      filename: '/project/libs/shared/util-theme/src/testing/fixtures.ts',
    },
  ],

  invalid: [
    {
      code: 'const s = { marginLeft: 16 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'marginLeft' } }],
    },
    {
      code: 'const s = { marginRight: 8 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'marginRight' } }],
    },
    {
      code: 'const s = { paddingLeft: 4 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'paddingLeft' } }],
    },
    {
      code: 'const s = { paddingRight: 12 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'paddingRight' } }],
    },
    {
      code: 'const s = { left: 0 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'left' } }],
    },
    {
      code: 'const s = { right: 0 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'right' } }],
    },
    {
      code: 'const s = { borderLeftWidth: 1 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'borderLeftWidth' } }],
    },
    {
      code: 'const s = { borderRightWidth: 1 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'borderRightWidth' } }],
    },
    {
      code: 'const s = { borderLeftColor: "red" };',
      errors: [{ messageId: 'bannedKey', data: { key: 'borderLeftColor' } }],
    },
    {
      code: 'const s = { borderRightColor: "red" };',
      errors: [{ messageId: 'bannedKey', data: { key: 'borderRightColor' } }],
    },
    {
      code: 'const s = { borderTopLeftRadius: 8 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'borderTopLeftRadius' } }],
    },
    {
      code: 'const s = { borderTopRightRadius: 8 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'borderTopRightRadius' } }],
    },
    {
      code: 'const s = { borderBottomLeftRadius: 8 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'borderBottomLeftRadius' } }],
    },
    {
      code: 'const s = { borderBottomRightRadius: 8 };',
      errors: [{ messageId: 'bannedKey', data: { key: 'borderBottomRightRadius' } }],
    },
  ],
});

console.log('no-raw-margin-left-right: all cases passed');
