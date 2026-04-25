const { withNxMetro } = require('@nx/expo');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const customConfig = {
  cacheVersion: 'alphaTiles',
  projectRoot,
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    // Exclude 'mjs' — ESM files use import.meta which Metro's CJS transform can't handle.
    // Packages like zustand ship both CJS (.js) and ESM (.mjs); we want the CJS build.
    sourceExts: [...sourceExts, 'cjs', 'svg'],
    unstable_enablePackageExports: true,
    // Prefer 'require' (CJS) over 'import' (ESM) when resolving package.json exports.
    unstable_conditionNames: ['react-native', 'browser', 'require', 'default'],
  },
};

// withNxMetro overrides projectRoot to workspaceRoot (breaks expo-router) and
// replaces resolver.nodeModulesPaths with workspace-only (drops Expo defaults).
// Re-override both after the fact.
const nxConfig = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  debug: false,
  extensions: [],
  watchFolders: [...defaultConfig.watchFolders, workspaceRoot],
});

module.exports = {
  ...nxConfig,
  projectRoot,
  resolver: {
    ...nxConfig.resolver,
    nodeModulesPaths: defaultConfig.resolver.nodeModulesPaths,
    // expo-router@55 ships without a node/ dir; the SSR renderer lives in @expo/router-server.
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'expo-router/node/render.js') {
        return {
          filePath: require.resolve('@expo/router-server/node/render.js'),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};
