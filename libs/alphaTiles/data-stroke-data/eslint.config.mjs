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
          ignoredDependencies: ['@alphaTiles/data-language-assets', '@alphaTiles/data-language-pack'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
