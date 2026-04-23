import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/jest.config.{js,ts,cjs,mjs}',
            '{projectRoot}/src/**/*.test.ts',
            '{projectRoot}/src/**/*.test.tsx',
            '{projectRoot}/src/**/*.spec.ts',
            '{projectRoot}/src/**/*.spec.tsx',
          ],
          // @generated/langManifest maps to the alphaTiles app project.
          // It's a build-artifact alias, not a real package dep.
          // See data-language-assets design.md §D10.
          ignoredDependencies: ['alphaTiles'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    // LangAssetsProvider.tsx imports @generated/langManifest, which ESLint maps to
    // apps/alphaTiles/src/generated/langManifest.ts (the alphaTiles app project).
    // This creates an apparent lib→app dependency and circular-dep alert.
    // @generated/langManifest is a build-artifact alias, not a runtime package.
    // See design.md §D10.
    files: ['**/LangAssetsProvider.tsx'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
