/**
 * Stub for expo-constants in Storybook / Vite context.
 * getBuildLang() reads Constants.expoConfig.extra.appLang.
 * We expose a minimal shape so it returns undefined gracefully
 * (getBuildLang falls back to empty string → Storybook shows EN chrome).
 */
const Constants = {
  expoConfig: {
    extra: {},
  },
};

export default Constants;
