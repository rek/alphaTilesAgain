const path = require('path');
const defaultResolver = require('@nx/jest/plugins/resolver');

const appNodeModules = path.resolve(__dirname, 'node_modules');
const emptyMock = path.resolve(__dirname, 'src/__mocks__/empty.js');

// Expo HMR/FastRefresh modules crash in Jest (missing bundleEntry)
const hmrMocks = new Set(['./setupHMR', './setupFastRefresh']);

module.exports = (request, options) => {
  if (
    hmrMocks.has(request) &&
    options.basedir?.includes('expo/src/async-require')
  ) {
    return emptyMock;
  }

  if (
    options.basedir?.includes('expo/src/winter') &&
    request === './runtime'
  ) {
    return defaultResolver('./runtime.ts', options);
  }

  return defaultResolver(request, {
    ...options,
    paths: [appNodeModules, ...(options.paths || [])],
  });
};
