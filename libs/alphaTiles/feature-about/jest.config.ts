export default {
  displayName: 'feature-about',
  preset: 'jest-expo',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  passWithNoTests: true,
  coverageDirectory: '../../../coverage/libs/alphaTiles/feature-about',
  moduleNameMapper: {
    '^@alphaTiles/data-language-assets$': '<rootDir>/src/__mocks__/data-language-assets.ts',
    '^@shared/util-i18n$': '<rootDir>/src/__mocks__/util-i18n.ts',
    '^@shared/util-analytics$': '<rootDir>/src/__mocks__/util-analytics.ts',
    '^expo-application$': '<rootDir>/src/__mocks__/expo-application.ts',
    '^expo-web-browser$': '<rootDir>/src/__mocks__/expo-web-browser.ts',
  },
};
