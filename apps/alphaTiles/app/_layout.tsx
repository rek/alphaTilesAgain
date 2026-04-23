import React from 'react';
import Constants from 'expo-constants';
import * as ExpoLocalization from 'expo-localization';
import { Stack } from 'expo-router';
import { I18nManager } from 'react-native';
import { LangAssetsProvider, useLangAssets } from '@alphaTiles/data-language-assets';
import { ThemeProvider, useFontsReady } from '@shared/util-theme';
import { I18nProvider, initI18n } from '@shared/util-i18n';
import { langManifest } from '@generated/langManifest';
import type { FontSource } from 'expo-font';

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

// Boot i18next at module load time alongside font loading (design.md §D1, boot order).
// initI18n is idempotent — safe to call at module scope.
void initI18n({ deviceLocale: ExpoLocalization.locale });

// Font map for expo-font: keys become font-family names at runtime.
// Shape matches langManifest.fonts: { primary: require(...ttf), primaryBold?: require(...ttf) }
const FONT_ASSET_MAP = langManifest.fonts as Record<string, FontSource>;

// Font-family name strings are the keys used in useFonts() — must match exactly.
const FONT_NAME_MAP = {
  primary: 'primary',
  primaryBold: langManifest.fonts.primaryBold !== undefined ? 'primaryBold' : undefined,
} as const;

/**
 * Inner layout — must be inside LangAssetsProvider so it can call useLangAssets().
 * Gates rendering until fonts have loaded to prevent flash of unstyled text.
 * See design.md §D5.
 */
function InnerLayout(): React.JSX.Element | null {
  const assets = useLangAssets();
  const fontsReady = useFontsReady(FONT_ASSET_MAP);

  if (!fontsReady) {
    // Fonts still loading — render nothing (prevents flash of unstyled text)
    return null;
  }

  return (
    <ThemeProvider
      palette={assets.colors.hexByIndex}
      fontMap={FONT_NAME_MAP}
    >
      <Stack />
    </ThemeProvider>
  );
}

export default function RootLayout(): React.JSX.Element {
  return (
    <I18nProvider>
      <LangAssetsProvider>
        <InnerLayout />
      </LangAssetsProvider>
    </I18nProvider>
  );
}
