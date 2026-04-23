export default {
  displayName: 'data-language-assets',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  passWithNoTests: true,
  coverageDirectory: '../../../coverage/libs/alphaTiles/data-language-assets',
};
