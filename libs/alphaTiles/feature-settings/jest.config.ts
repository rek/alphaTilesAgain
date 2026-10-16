export default {
  displayName: 'feature-settings',
  preset: 'jest-expo',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  passWithNoTests: true,
  coverageDirectory: '../../../coverage/libs/alphaTiles/feature-settings',
  moduleNameMapper: {
    '^@shared/util-theme$': '<rootDir>/../../shared/util-theme/src/index.ts',
  },
};
