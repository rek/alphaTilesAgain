// Precomputes must be registered before LangAssetsProvider (AppRoot) mounts.
import '../src/registerPrecomputes';
import React from 'react';
import { Stack } from 'expo-router';
import { AppRoot } from '@alphaTiles/feature-loading';

/** App shell: providers, fonts, audio gate and boot live in feature-loading's AppRoot. */
export default function RootLayout(): React.JSX.Element {
  return (
    <AppRoot>
      <Stack screenOptions={{ headerShown: false }} />
    </AppRoot>
  );
}
