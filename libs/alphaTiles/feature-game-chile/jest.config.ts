export default {
  displayName: 'feature-game-chile',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/alphaTiles/feature-game-chile',
  moduleNameMapper: {
    '\\.(ttf|otf|png|jpg|mp3|wav)$': '<rootDir>/__mocks__/fileMock.js',
    '^@generated/langManifest$': '<rootDir>/__mocks__/langManifest.ts',
    '^@alphaTiles/data-language-assets$': '<rootDir>/__mocks__/data-language-assets.ts',
  },
};
