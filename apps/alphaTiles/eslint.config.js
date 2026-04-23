// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'app-example/*', 'src/generated/*', 'jest.config.js', 'jest.resolver.js'],
  },
  {
    // NX path aliases are not resolvable by eslint-plugin-import without
    // additional resolver config. Mark them as known-resolved to avoid
    // false import/no-unresolved errors on @shared/* and @alphaTiles/* paths.
    settings: {
      'import/ignore': [
        '^@shared/',
        '^@alphaTiles/',
        '^@generated/',
        '^expo-font',
      ],
    },
    rules: {
      'import/no-unresolved': ['error', {
        ignore: ['^@shared/', '^@alphaTiles/', '^@generated/'],
      }],
    },
  },
]);
