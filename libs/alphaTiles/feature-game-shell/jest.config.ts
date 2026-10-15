export default {
  displayName: 'feature-game-shell',
  preset: 'jest-expo',
  // jest-expo has no tsconfig-paths resolver; nx's maps @shared/* + @alphaTiles/*.
  resolver: '@nx/jest/plugins/resolver',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/alphaTiles/feature-game-shell',
};
