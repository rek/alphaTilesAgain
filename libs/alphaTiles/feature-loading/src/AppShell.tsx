import React, { useMemo } from 'react';
import { useLangAssets } from '@alphaTiles/data-language-assets';
import { ThemeProvider, useFontsReady } from '@shared/util-theme';
import { AudioProvider, AudioGate, preloadAudio, BASE_CHIMES } from '@alphaTiles/data-audio';
import type { AudioConfig } from '@alphaTiles/data-audio';
import { TapToBegin } from './TapToBegin';
import { BootGate } from './BootGate';

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
  const fontNameMap = useMemo(
    () => ({
      primary: assets.fonts.primary != null ? 'primary' : undefined,
      primaryBold: assets.fonts.primaryBold != null ? 'primaryBold' : undefined,
    }),
    [assets],
  );
  const fontsReady = useFontsReady(fontAssetMap);

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
  }, [assets]);

  return (
    <AudioProvider loader={audioLoader}>
      {fontsReady ? (
        <ThemeProvider palette={assets.colors.hexByIndex} fontMap={fontNameMap}>
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
