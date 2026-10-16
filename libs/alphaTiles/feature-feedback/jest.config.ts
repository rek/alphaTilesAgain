export default {
  displayName: 'feature-feedback',
  preset: 'jest-expo',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  passWithNoTests: true,
  moduleNameMapper: {
    '^@shared/util-theme$': '<rootDir>/../../shared/util-theme/src/index.ts',
  },
  coverageDirectory: '../../../coverage/libs/alphaTiles/feature-feedback',
};
