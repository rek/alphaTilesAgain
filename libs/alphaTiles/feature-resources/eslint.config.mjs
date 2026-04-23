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
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    // ResourcesContainer imports @alphaTiles/data-language-assets which imports
    // @generated/langManifest (the alphaTiles app). This creates an apparent
    // lib→app→lib cycle through the app's route files.
    // The @generated/langManifest alias is a build-artifact alias, not runtime
    // coupling. See data-language-assets design.md §D10.
    files: ['**/ResourcesContainer.tsx'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
