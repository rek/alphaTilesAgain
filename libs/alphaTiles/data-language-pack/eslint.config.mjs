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
            '{projectRoot}/src/**/*.spec.ts',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    // loadLangPack.ts imports runPrecomputes from @shared/util-precompute.
    // util-precompute imports LangAssets type-only from @alphaTiles/data-language-pack.
    // ESLint's circular-dep check fires on this type-only cycle.
    // The cycle is safe: TypeScript erases type imports; no runtime circularity.
    // See lang-assets-runtime design.md §D5 and precompute-registry MODIFIED spec.
    files: ['**/loadLangPack.ts', '**/loadLangPack.test.ts'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
