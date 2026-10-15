// https://docs.expo.dev/guides/using-eslint/
// Root nx config first: @nx/enforce-module-boundaries (type:app → type:feature)
// and the shared hygiene rules apply to the app shell like every lib.
import { createRequire } from 'module';
import baseConfig from '../../eslint.config.mjs';

const require = createRequire(import.meta.url);
const expoConfig = require('eslint-config-expo/flat');

export default [
  ...baseConfig,
  ...expoConfig,
  {
    ignores: ['dist/*', 'app-example/*', 'src/generated/*', 'jest.config.js', 'jest.resolver.js', '.expo/*'],
  },
  {
    // NX path aliases are not resolvable by eslint-plugin-import without
    // additional resolver config. Mark them as known-resolved to avoid
    // false import/no-unresolved errors on @shared/* and @alphaTiles/* paths.
    settings: {
      'import/ignore': ['^@shared/', '^@alphaTiles/', '^@generated/', '^expo-font'],
    },
    rules: {
      'import/no-unresolved': ['error', {
        ignore: ['^@shared/', '^@alphaTiles/', '^@generated/'],
      }],
      // react-native uses Flow syntax; eslint-plugin-import can't parse it.
      // eslint-config-expo/flat re-enables this rule, so we must override here.
      'import/namespace': 'off',
    },
  },
  {
    // Parked stroke spikes (never routed): read tools/data stroke JSON directly.
    files: ['src/dev/**'],
    rules: { '@nx/enforce-module-boundaries': 'off' },
  },
];
