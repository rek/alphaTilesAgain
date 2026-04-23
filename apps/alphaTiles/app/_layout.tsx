import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { I18nManager } from 'react-native';

// Apply RTL at module load time, before the root component mounts.
// scriptDirection is set by app.config.ts reading aa_langinfo.txt.
// Per ADR-001 and build-pipeline spec: this is build-time, not runtime switching.
const scriptDirection = Constants.expoConfig?.extra?.scriptDirection as string | undefined;
if (scriptDirection === 'RTL') {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  return <Stack />;
}
