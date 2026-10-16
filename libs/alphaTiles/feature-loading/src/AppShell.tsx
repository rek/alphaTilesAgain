import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { ThemeProvider, useFontsReady } from '@shared/util-theme';
import { AudioProvider, AudioGate, preloadAudio, BASE_CHIMES } from '@alphaTiles/data-audio';
import type { AudioConfig } from '@alphaTiles/data-audio';
import { effectiveSettingsOf } from '@alphaTiles/data-settings';
import { TapToBegin } from './TapToBegin';
import { fontNameMapOf } from './fontNameMapOf';
import { BootGate } from './BootGate';

// Dev-only WebMCP agent tools (docs/TESTING.md). A `require` inside the
// `__DEV__` branch, not a static import: Metro does not tree-shake, but it
// constant-folds `__DEV__` before collecting dependencies, so a production
// export never bundles the module.
const AgentToolsBridge =
  __DEV__ && Platform.OS === 'web'
    ? (require('./agentTools/AgentToolsBridge') as typeof import('./agentTools/AgentToolsBridge')).AgentToolsBridge
    : null;

/**
 * Inside LangAssetsProvider (AppRoot). AudioProvider mounts unconditionally so
 * audio loads in parallel with fonts. Children (the routed Stack) gate on
 * fontsReady (no flash of unstyled text), the web AudioGate, then BootGate.
 * See design.md §D5.
 */
export function AppShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const assets = useLangAssets();

  // Font map for expo-font: keys become font-family names at runtime.
  // Pack without fonts/ → key absent → system font.
  const fontAssetMap = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(assets.fonts).filter(([, v]) => v != null),
      ) as unknown as Parameters<typeof useFontsReady>[0],
    [assets],
  );
  const { ready: fontsReady, failed: fontsFailed } = useFontsReady(fontAssetMap);
  const fontNameMap = useMemo(
    () => fontNameMapOf({ fonts: assets.fonts, failed: fontsFailed }),
    [assets, fontsFailed],
  );

  // Pack-wide typography multiplier ("Font Scale" in aa_settings.txt).
  const fontScale = useMemo(
    () => effectiveSettingsOf({ settings: assets.settings }).fontScale,
    [assets],
  );

  // Stable loader — assets from LangAssetsProvider are fixed for the app lifetime.
  const audioLoader = useMemo(() => {
    // Pack values only: preload is per build, not per player.
    const { hasTileAudio, hasSyllableAudio } = effectiveSettingsOf({ settings: assets.settings });
    const audioConfig: AudioConfig = { hasTileAudio, hasSyllableAudio };
    const manifest = {
      tiles: assets.audio.tiles,
      words: assets.audio.words,
      syllables: assets.audio.syllables,
      instructions: assets.audio.instructions,
    };
    return (onProgress: (loaded: number, total: number) => void) =>
      preloadAudio({ manifest, audioConfig, baseChimes: BASE_CHIMES, onProgress });
  }, [assets]);

  return (
    <AudioProvider loader={audioLoader}>
      {AgentToolsBridge ? <AgentToolsBridge /> : null}
      {fontsReady ? (
        <ThemeProvider
          palette={assets.colors.hexByIndex}
          fontMap={fontNameMap}
          fontScale={fontScale}
        >
          {/* Web: browsers block audio until a gesture (#47). AudioGate covers
              every route (cold start, reload, deep link); native passes through. */}
          <AudioGate renderLocked={(gate) => <TapToBegin {...gate} />}>
            <BootGate>{children}</BootGate>
          </AudioGate>
        </ThemeProvider>
      ) : null}
    </AudioProvider>
  );
}
