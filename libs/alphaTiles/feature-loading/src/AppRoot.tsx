/**
 * AppRoot — everything the root layout renders around the routed Stack:
 * i18n, language pack, audio, fonts/theme, the web AudioGate and BootGate.
 * apps/alphaTiles/app/_layout.tsx is `<AppRoot><Stack /></AppRoot>`.
 *
 * Module-load side effects below run when the root layout imports this lib,
 * before any React tree renders.
 */
import React from 'react';
import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LangAssetsProvider } from '@alphaTiles/data-language-assets';
import { I18nProvider, initI18n } from '@shared/util-i18n';
import { AppShell } from './AppShell';

// Keep splash visible until BootGate hides it at mount (design D5) — every
// entry route goes through BootGate, so deep links hide it too.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Apply RTL at module load time, before the root component mounts.
// scriptDirection is set by app.config.ts reading aa_langinfo.txt.
// Per ADR-001 and build-pipeline spec: this is build-time, not runtime switching.
// RTL setup MUST remain outside the provider (I18nManager.forceRTL is a static
// config call that must happen before any React tree renders — design.md §D6).
const scriptDirection = Constants.expoConfig?.extra?.['scriptDirection'] as string | undefined;
if (scriptDirection === 'RTL') {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// Detect device locale — getLocales()[0].languageTag is the BCP-47 primary locale.
// Falls back to 'en' if expo-localization returns an empty list (unlikely but safe).
const deviceLocale = getLocales()[0]?.languageTag ?? 'en';

// Boot i18next at module load time alongside font loading (design.md §D1, boot order).
// initI18n is idempotent — safe to call at module scope.
void initI18n({ deviceLocale });

export function AppRoot({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <I18nProvider>
      <LangAssetsProvider>
        <AppShell>{children}</AppShell>
      </LangAssetsProvider>
    </I18nProvider>
  );
}
