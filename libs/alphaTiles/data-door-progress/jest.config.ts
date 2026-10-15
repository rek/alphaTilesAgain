export default {
  displayName: 'data-door-progress',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/alphaTiles/data-door-progress',
  moduleNameMapper: {
    // Tests run the real progress store, persisted to an in-memory AsyncStorage.
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/../data-progress/__mocks__/@react-native-async-storage/async-storage.ts',
    '^@alphaTiles/data-language-assets$': '<rootDir>/__mocks__/data-language-assets.ts',
  },
};
