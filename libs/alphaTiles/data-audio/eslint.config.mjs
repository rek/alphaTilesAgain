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
          // expo-audio is a peer dep installed in the app, not this lib.
          // @alphaTiles/data-language-pack provides LangAssets type only (type import).
          ignoredDependencies: ['expo-audio', '@alphaTiles/data-language-pack'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    // baseChimes.ts uses require() to reach into apps/alphaTiles/assets/audio/.
    // Intentional per design D5 — base chimes are an app-level asset by definition.
    files: ['**/baseChimes.ts'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
