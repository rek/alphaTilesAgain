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
            '{projectRoot}/src/**/*.stories.tsx',
            '{projectRoot}/src/**/*.stories.ts',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    // AboutContainer imports @alphaTiles/data-language-assets which imports
    // @generated/langManifest (the alphaTiles app). This creates an apparent
    // lib→app→lib cycle. The cycle passes through the app's route files which
    // re-export these containers — not a runtime dependency.
    // The @generated/langManifest alias is a build-artifact alias, not runtime
    // coupling. Disable the module-boundaries rule on container files.
    files: ['**/AboutContainer.tsx'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
