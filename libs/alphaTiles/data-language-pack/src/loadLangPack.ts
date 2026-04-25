/**
 * Single synchronous entry point for materializing a language pack at boot.
 *
 * Calls parsePack → resolveAudio / resolveImages / resolveFonts → runPrecomputes
 * and returns a fully-wired LangAssets object. No async, no IO.
 *
 * Metro resolves all require() numbers eagerly during bundle load, so this
 * function completes synchronously.
 *
 * See design.md §D2.
 */

import { parsePack } from '@shared/util-lang-pack-parser';
import { runPrecomputes } from '@shared/util-precompute';
import type { LangAssets } from './LangAssets';
import { resolveAudio } from './internal/resolveAudio';
import { resolveImages } from './internal/resolveImages';
import { resolveFonts } from './internal/resolveFonts';

/**
 * Minimal manifest shape needed by the loader.
 * The real LangManifest from @generated/langManifest satisfies this.
 */
type ManifestInput = {
  code: string;
  rawFiles: Record<string, string>;
  fonts: {
    primary?: number;
    // Generator emits `null` when no bold font exists (see tools/generate-lang-manifest.ts).
    primaryBold?: number | null;
  };
  images: {
    icon: number;
    splash: number;
    avatars: readonly number[];
    avataricons: readonly number[];
    tiles: Record<string, number>;
    words: Record<string, number>;
  };
  audio: {
    tiles: Record<string, number>;
    words: Record<string, number>;
    syllables: Record<string, number>;
    instructions: Record<string, number>;
  };
};

export function loadLangPack(manifest: ManifestInput): LangAssets {
  // Parse all aa_*.txt files. Throws LangPackParseError on malformed input.
  const parsed = parsePack(manifest.rawFiles);

  const audio = resolveAudio(manifest.audio, parsed);
  const images = resolveImages(manifest.images, parsed);
  const fonts = resolveFonts(manifest.fonts);

  const assets: LangAssets = {
    code: manifest.code,
    langInfo: parsed.langInfo,
    settings: parsed.settings,
    tiles: parsed.tiles,
    words: parsed.words,
    syllables: parsed.syllables,
    keys: parsed.keys,
    games: parsed.games,
    names: parsed.names,
    resources: parsed.resources,
    colors: parsed.colors,
    share: parsed.share,
    fonts,
    images,
    audio,
    precomputes: new Map(), // populated below
  };

  // Run precomputes against the assembled assets.
  // runPrecomputes throws (with key attached) if any registered fn throws.
  const precomputes = runPrecomputes(assets);
  return { ...assets, precomputes };
}
