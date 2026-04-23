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
    // SetPlayerNameContainer imports @alphaTiles/data-language-assets which imports
    // @generated/langManifest (the alphaTiles app). This creates an apparent
    // lib→app→lib cycle via the route re-export. The @generated/langManifest alias
    // is a build-artifact alias, not runtime coupling. See data-language-assets design.md §D10.
    files: ['**/SetPlayerNameContainer.tsx'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
