/**
 * Canonical type for the fully-wired language pack.
 * All fields are inferred from parser ReturnType — no hand-maintained sub-types.
 *
 * See design.md §D1 and lang-assets-runtime spec.
 */

import type {
  parseGametiles,
  parseWordlist,
  parseSyllables,
  parseKeyboard,
  parseGames,
  parseLangInfo,
  parseSettings,
  parseNames,
  parseResources,
  parseColors,
} from '@shared/util-lang-pack-parser';

export interface LangAssets {
  /** Language code, e.g. "eng". From langManifest.code. */
  code: string;
  langInfo: ReturnType<typeof parseLangInfo>;
  settings: ReturnType<typeof parseSettings>;
  tiles: ReturnType<typeof parseGametiles>;
  words: ReturnType<typeof parseWordlist>;
  syllables: ReturnType<typeof parseSyllables>;
  keys: ReturnType<typeof parseKeyboard>;
  games: ReturnType<typeof parseGames>;
  names: ReturnType<typeof parseNames>;
  resources: ReturnType<typeof parseResources>;
  colors: ReturnType<typeof parseColors>;
  /** Bare share-link string from aa_share.txt. */
  share: string;
  fonts: {
    primary: number;
    primaryBold?: number;
  };
  images: {
    icon: number;
    splash: number;
    /** 12 entries, indexed 0-based by avatar index. */
    avatars: number[];
    avataricons: number[];
    /** Keyed by tile.base. Empty map for packs with no tile glyph images. */
    tiles: Record<string, number>;
    /** Keyed by word.wordInLWC (primary image). */
    words: Record<string, number>;
    /** Keyed by word.wordInLWC (distractor variant image, e.g. <word>2.png). */
    wordsAlt: Record<string, number>;
  };
  audio: {
    /** Keyed by tile.base (not the manifest's audioName key). */
    tiles: Record<string, number>;
    /** Keyed by word.wordInLWC. */
    words: Record<string, number>;
    /** Keyed by syllable.syllable. */
    syllables: Record<string, number>;
    /** Keyed by game.instructionAudio. */
    instructions: Record<string, number>;
  };
  /** Output of runPrecomputes(). Typed access via usePrecompute<T>(key). */
  precomputes: Map<string, unknown>;
}
