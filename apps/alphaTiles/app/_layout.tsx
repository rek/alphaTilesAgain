import React, { useMemo } from 'react';
import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';
import { Stack } from 'expo-router';
import { I18nManager } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LangAssetsProvider, useLangAssets } from '@alphaTiles/data-language-assets';
import { ThemeProvider, useFontsReady } from '@shared/util-theme';
import { I18nProvider, initI18n } from '@shared/util-i18n';
import { langManifest } from '@generated/langManifest';
import { AudioProvider, preloadAudio, BASE_CHIMES } from '@alphaTiles/data-audio';
import type { AudioConfig } from '@alphaTiles/data-audio';
import type { FontSource } from 'expo-font';
import './registerPrecomputes';

// Keep splash visible until LoadingContainer hides it explicitly (design D5).
SplashScreen.preventAutoHideAsync().catch(() => {});

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

// Detect device locale — getLocales()[0].languageTag is the BCP-47 primary locale.
// Falls back to 'en' if expo-localization returns an empty list (unlikely but safe).
const deviceLocale = getLocales()[0]?.languageTag ?? 'en';

// Boot i18next at module load time alongside font loading (design.md §D1, boot order).
// initI18n is idempotent — safe to call at module scope.
void initI18n({ deviceLocale });

// Font map for expo-font: keys become font-family names at runtime.
// Shape matches langManifest.fonts: { primary: require(...ttf), primaryBold?: require(...ttf) }
const FONT_ASSET_MAP = Object.fromEntries(
  Object.entries(langManifest.fonts).filter(([, v]) => v != null),
) as Record<string, FontSource>;

// Font-family name strings are the keys used in useFonts() — must match exactly.
const FONT_NAME_MAP = {
  primary: 'primary',
  primaryBold: langManifest.fonts.primaryBold != null ? 'primaryBold' : undefined,
} as const;

/**
 * Inner layout — must be inside LangAssetsProvider so it can call useLangAssets().
 * AudioProvider mounts unconditionally so audio loads in parallel with fonts.
 * Stack (and all screens) gate on fontsReady to prevent flash of unstyled text.
 * See design.md §D5.
 */
function InnerLayout(): React.JSX.Element {
  const assets = useLangAssets();
  const fontsReady = useFontsReady(FONT_ASSET_MAP);

  // Stable loader — assets from LangAssetsProvider are fixed for the app lifetime.
  const audioLoader = useMemo(() => {
    const audioConfig: AudioConfig = {
      hasTileAudio: assets.settings.findBoolean('Has tile audio', false),
      hasSyllableAudio: assets.settings.findBoolean('Has syllable audio', false),
    };
    const manifest = {
      tiles: assets.audio.tiles,
      words: assets.audio.words,
      syllables: assets.audio.syllables,
      instructions: assets.audio.instructions,
    };
    return (onProgress: (loaded: number, total: number) => void) =>
      preloadAudio({ manifest, audioConfig, baseChimes: BASE_CHIMES, onProgress });
  }, [assets]); // assets reference is stable for the app lifetime

  return (
    <AudioProvider loader={audioLoader}>
      {fontsReady ? (
        <ThemeProvider
          palette={assets.colors.hexByIndex}
          fontMap={FONT_NAME_MAP}
        >
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      ) : null}
    </AudioProvider>
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
