export default {
  displayName: 'tools',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@shared/util-lang-pack-parser$': '<rootDir>/../libs/shared/util-lang-pack-parser/src/index.ts',
    '^@shared/util-lang-pack-validator$': '<rootDir>/../libs/shared/util-lang-pack-validator/src/index.ts',
    '^@shared/util-phoneme$': '<rootDir>/../libs/shared/util-phoneme/src/index.ts',
  },
  coverageDirectory: '../coverage/tools',
};
