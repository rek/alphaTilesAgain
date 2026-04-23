export default {
  displayName: 'util-ota',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../../coverage/libs/shared/util-ota',
  moduleNameMapper: {
    '^@shared/util-analytics$': '<rootDir>/../util-analytics/src/index.ts',
    // expo-updates is not installed in the workspace root; map to the manual mock.
    // Individual tests override via jest.mock() factory.
    '^expo-updates$': '<rootDir>/src/__mocks__/expo-updates.ts',
  },
};
