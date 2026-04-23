import React from 'react';
import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';
import { Redirect, Stack } from 'expo-router';
import { I18nManager } from 'react-native';
import { LangAssetsProvider, useLangAssets } from '@alphaTiles/data-language-assets';
import { ThemeProvider, useFontsReady } from '@shared/util-theme';
import { I18nProvider, initI18n } from '@shared/util-i18n';
import { langManifest } from '@generated/langManifest';
import { usePlayersStore } from '@alphaTiles/data-players';
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

// Detect device locale — getLocales()[0].languageTag is the BCP-47 primary locale.
// Falls back to 'en' if expo-localization returns an empty list (unlikely but safe).
const deviceLocale = getLocales()[0]?.languageTag ?? 'en';

// Boot i18next at module load time alongside font loading (design.md §D1, boot order).
// initI18n is idempotent — safe to call at module scope.
void initI18n({ deviceLocale });

// Font map for expo-font: keys become font-family names at runtime.
// Shape matches langManifest.fonts: { primary: require(...ttf), primaryBold?: require(...ttf) }
const FONT_ASSET_MAP = langManifest.fonts as Record<string, FontSource>;

// Font-family name strings are the keys used in useFonts() — must match exactly.
const FONT_NAME_MAP = {
  primary: 'primary',
  primaryBold: langManifest.fonts.primaryBold !== undefined ? 'primaryBold' : undefined,
} as const;

/**
 * Derives the boot entry route from persisted player state.
 * Reads store synchronously — no useEffect (ARCHITECTURE.md §7, CLAUDE.md rules).
 *
 * Rules (spec.md §Entry-route derivation):
 *  - activePlayerId valid → /menu
 *  - activePlayerId stale (not in players) → clear it, go to /choose-player
 *  - activePlayerId null → /choose-player
 */
function EntryRedirect(): React.JSX.Element {
  const { activePlayerId, players, clearActivePlayer } = usePlayersStore.getState();

  if (activePlayerId !== null) {
    const activeExists = players.some((p) => p.id === activePlayerId);
    if (!activeExists) {
      // Stale id — clear and fall through to /choose-player
      clearActivePlayer();
      return <Redirect href="/choose-player" />;
    }
    return <Redirect href="/menu" />;
  }

  return <Redirect href="/choose-player" />;
}

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
