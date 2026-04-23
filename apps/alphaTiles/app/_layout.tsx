import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { I18nManager } from 'react-native';
import { LangAssetsProvider } from '@alphaTiles/data-language-assets';

// Apply RTL at module load time, before the root component mounts.
// scriptDirection is set by app.config.ts reading aa_langinfo.txt.
// Per ADR-001 and build-pipeline spec: this is build-time, not runtime switching.
// RTL setup MUST remain outside the provider (I18nManager.forceRTL is a static
// config call that must happen before any React tree renders — design.md §D6).
const scriptDirection = Constants.expoConfig?.extra?.scriptDirection as string | undefined;
if (scriptDirection === 'RTL') {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  return (
    <LangAssetsProvider>
      <Stack />
    </LangAssetsProvider>
  );
}
