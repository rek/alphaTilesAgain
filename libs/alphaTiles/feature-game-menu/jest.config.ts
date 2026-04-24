export default {
  displayName: 'feature-game-menu',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../../coverage/libs/alphaTiles/feature-game-menu',
  moduleNameMapper: {
    '\\.(ttf|otf|png|jpg|mp3|wav)$': '<rootDir>/__mocks__/fileMock.js',
    '^@generated/langManifest$': '<rootDir>/__mocks__/langManifest.ts',
    '^@alphaTiles/data-language-assets$': '<rootDir>/__mocks__/data-language-assets.ts',
    '^@alphaTiles/data-progress$': '<rootDir>/__mocks__/data-progress.ts',
  },
};
