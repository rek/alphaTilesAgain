export default {
  displayName: 'data-stroke-data',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  passWithNoTests: true,
  coverageDirectory: '../../../coverage/libs/alphaTiles/data-stroke-data',
  moduleNameMapper: {
    '^@alphaTiles/data-language-assets$': '<rootDir>/src/__mocks__/data-language-assets.ts',
  },
};
