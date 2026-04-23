import nx from '@nx/eslint-plugin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Custom ESLint rule: no-raw-margin-left-right
 * Bans physical-direction style keys (marginLeft, marginRight, paddingLeft,
 * paddingRight, left, right, borderLeftWidth, borderRightWidth, borderLeftColor,
 * borderRightColor, borderTopLeftRadius, borderTopRightRadius,
 * borderBottomLeftRadius, borderBottomRightRadius).
 * Enforces logical props for RTL safety — ARCHITECTURE.md §16, design.md §D6.
 * Files under libs/shared/util-theme are allowlisted.
 */
const noRawMarginRule = require('./tools/eslint-rules/no-raw-margin-left-right.js');

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [
            '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$',
            // locales/*.json are workspace-root data files, not NX projects.
            // util-i18n requires them for chrome defaults (design.md D9).
            '^(?:\\.\\./)*locales/.*\\.json$',
          ],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
            // type:tooling libs (e.g. storybook-host) are config-only; they export nothing.
            // The constraint below ensures they can only depend on each other (type:tooling).
            // Since no lib should import @shared/storybook-host, this acts as the firewall:
            // tooling → tooling OK; tooling → everything OK (Storybook config imports anything).
            // Other layers are prevented at review/convention level (no runtime import path exists).
            {
              sourceTag: 'type:tooling',
              onlyDependOnLibsWithTags: ['type:tooling', 'type:ui', 'type:util'],
            },
            // type:ui libs must not import react-i18next or i18next directly.
            // They accept pre-translated strings as props (design.md §D6, ARCHITECTURE.md §10).
            {
              sourceTag: 'type:ui',
              bannedExternalImports: ['react-i18next', 'i18next'],
            },
            // Only util-i18n may import i18next/react-i18next as a source lib.
            // All other libs must import from @shared/util-i18n instead.
            {
              sourceTag: 'type:feature',
              bannedExternalImports: ['i18next'],
            },
            {
              sourceTag: 'type:data-access',
              bannedExternalImports: ['i18next'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
  // theme-hygiene: enforce logical props over physical direction keys.
  // See ARCHITECTURE.md §16 and openspec/changes/theme-fonts/design.md §D6.
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      'theme-hygiene': {
        rules: {
          'no-raw-margin-left-right': noRawMarginRule,
        },
      },
    },
    rules: {
      'theme-hygiene/no-raw-margin-left-right': 'error',
    },
  },
];
