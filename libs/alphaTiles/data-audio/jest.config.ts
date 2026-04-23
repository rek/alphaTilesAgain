export default {
  displayName: 'data-audio',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/test-setup.ts'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  passWithNoTests: true,
  coverageDirectory: '../../../coverage/libs/alphaTiles/data-audio',
  moduleNameMapper: {
    // expo-audio is mocked in tests — map to an empty module so Jest can resolve it
    '^expo-audio$': '<rootDir>/src/__mocks__/expo-audio.ts',
    // react-native Platform is mocked per-test via jest.mock
    '^react-native$': '<rootDir>/src/__mocks__/react-native.ts',
    '^@shared/util-analytics$': '<rootDir>/src/__mocks__/util-analytics.ts',
  },
};
