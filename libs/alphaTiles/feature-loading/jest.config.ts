export default {
  displayName: 'feature-loading',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/alphaTiles/feature-loading',
  moduleNameMapper: {
    '^@alphaTiles/data-players$': '<rootDir>/__mocks__/data-players.ts',
  },
};
