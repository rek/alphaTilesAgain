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
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
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
  },
};
