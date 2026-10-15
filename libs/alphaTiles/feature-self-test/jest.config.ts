export default {
  displayName: 'feature-self-test',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../../coverage/libs/alphaTiles/feature-self-test',
  moduleNameMapper: {
    '\\.(ttf|otf|png|jpg|mp3|wav)$': '<rootDir>/__mocks__/fileMock.js',
    '^@generated/langManifest$': '<rootDir>/__mocks__/langManifest.ts',
    '^@alphaTiles/data-language-assets$': '<rootDir>/__mocks__/data-language-assets.ts',
    // Tests exercise the real Thailand question builder (pure), not the lib
    // root's RN container (game shell, audio, router), which node can't load.
    '^@alphaTiles/feature-game-thailand$':
      '<rootDir>/../feature-game-thailand/src/thailandQuestion.ts',
  },
};
