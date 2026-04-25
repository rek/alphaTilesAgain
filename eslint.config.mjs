import nx from '@nx/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
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
            // Layer hierarchy: app → feature → ui/data-access/util → util → nothing
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:feature'],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:ui', 'type:data-access', 'type:util'],
              // Only util-i18n may import i18next/react-i18next as a source lib.
              // All other libs must import from @shared/util-i18n instead.
              bannedExternalImports: ['i18next'],
            },
            // type:ui libs may compose other type:ui libs but must not pull in data-access or feature logic.
            // They accept pre-translated strings as props (design.md §D6, ARCHITECTURE.md §10).
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
              bannedExternalImports: ['react-i18next', 'i18next'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:util'],
              bannedExternalImports: ['i18next'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
            },
            // type:tooling libs (e.g. storybook-host) are config-only; they export nothing.
            // Storybook config imports components to render them, so ui/util deps are allowed.
            // Other layers are prevented at review/convention level (no runtime import path exists).
            {
              sourceTag: 'type:tooling',
              onlyDependOnLibsWithTags: ['type:tooling', 'type:ui', 'type:util'],
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
    rules: {
      // react-native index.js uses Flow syntax; import/namespace can't parse it.
      'import/namespace': 'off',
    },
  },
  // react-hooks: register plugin so eslint-disable comments for exhaustive-deps resolve.
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // tools/ scripts use relative lib imports — exempt from NX module boundaries.
  {
    files: ['tools/**/*.ts', 'tools/**/*.js'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
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
