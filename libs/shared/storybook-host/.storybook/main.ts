/**
 * Storybook composite host — "One Storybook For All" pattern.
 * Framework: @storybook/react-vite (Vite, not Webpack).
 * Stories discovered from every lib in the workspace via glob.
 * See design.md §D2, §D3, §D4, §D7.
 */
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // D4: glob relative to this .storybook/ dir.
  // ../../../ resolves to libs/ — covers all ui-* libs anywhere in the workspace.
  stories: [
    '../../../**/src/**/*.stories.@(ts|tsx|js|jsx|mdx)',
  ],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  // D3: react-native-web alias so RN primitives render in browser.
  // Also maps @shared/* tsconfig path aliases so preview.tsx can import workspace libs.
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    const path = await import('path');
    // Repo root is 4 levels up from .storybook/
    const root = path.resolve(__dirname, '../../../../');
    const libs = path.join(root, 'libs');
    const mocksDir = path.resolve(__dirname, './mocks');

    return mergeConfig(config, {
      resolve: {
        alias: [
          // Native-only codegen stub — react-native-safe-area-context spec files import this.
          // Must be listed before the bare react-native alias so the longer match wins.
          {
            find: 'react-native/Libraries/Utilities/codegenNativeComponent',
            replacement: `${mocksDir}/codegenNativeComponent.js`,
          },
          // AssetRegistry subpath used by some RN internals
          {
            find: 'react-native/Libraries/Image/AssetRegistry',
            replacement: 'react-native-web/dist/modules/AssetRegistry',
          },
          // Bare 'react-native' → react-native-web (regex: exact match only)
          {
            find: /^react-native$/,
            replacement: 'react-native-web',
          },
          // Expo stubs — expo-modules-core imports TurboModuleRegistry from react-native
          // which react-native-web doesn't export. Stub them out for browser context.
          {
            find: 'expo-modules-core',
            replacement: `${mocksDir}/expo-modules-core.js`,
          },
          {
            find: 'expo-constants',
            replacement: `${mocksDir}/expo-constants.js`,
          },
          // Workspace path aliases — mirror tsconfig.base.json paths
          {
            find: '@shared/util-theme/testing',
            replacement: path.join(libs, 'shared/util-theme/src/testing/index.ts'),
          },
          {
            find: '@shared/util-theme',
            replacement: path.join(libs, 'shared/util-theme/src/index.ts'),
          },
          {
            find: '@shared/util-i18n',
            replacement: path.join(libs, 'shared/util-i18n/src/index.ts'),
          },
        ],
      },
      define: {
        // RN and some Expo libs reference __DEV__ globally
        __DEV__: JSON.stringify(true),
      },
      optimizeDeps: {
        // Force Vite to pre-bundle so alias resolution applies at dep scan time
        include: ['react-native-web'],
      },
    });
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
