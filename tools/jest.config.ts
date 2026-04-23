export default {
  displayName: 'tools',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', esModuleInterop: true } }],
  },
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.test.ts'],
  coverageDirectory: '../coverage/tools',
};
