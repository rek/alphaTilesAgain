/**
 * Test helper factories for building minimal ParsedPack fragments.
 *
 * Provides sensible defaults for all required fields so individual check tests
 * can override only the fields they care about.
 */

import type { ParsedPack } from '@shared/util-lang-pack-parser';
import type { FileInventory } from '../FileInventory';

// ---------------------------------------------------------------------------
// Tile row defaults
// ---------------------------------------------------------------------------

interface TileRowOverride {
  base?: string;
  alt1?: string;
  alt2?: string;
  alt3?: string;
  type?: string;
  audioName?: string;
  upper?: string;
  tileTypeB?: string;
  audioNameB?: string;
  tileTypeC?: string;
  audioNameC?: string;
  iconicWord?: string;
  tileColor?: string;
  stageOfFirstAppearance?: number;
  stageOfFirstAppearanceType2?: number;
  stageOfFirstAppearanceType3?: number;
}

export function mkTileRow(override: TileRowOverride = {}) {
  return {
    base: override.base ?? 'a',
    alt1: override.alt1 ?? 'b',
    alt2: override.alt2 ?? 'c',
    alt3: override.alt3 ?? 'd',
    type: override.type ?? 'V',
    audioName: override.audioName ?? 'tile_a',
    upper: override.upper ?? '',
    tileTypeB: override.tileTypeB ?? 'none',
    audioNameB: override.audioNameB ?? '',
    tileTypeC: override.tileTypeC ?? 'none',
    audioNameC: override.audioNameC ?? '',
    iconicWord: override.iconicWord ?? '',
    tileColor: override.tileColor ?? '0',
    stageOfFirstAppearance: override.stageOfFirstAppearance ?? 1,
    stageOfFirstAppearanceType2: override.stageOfFirstAppearanceType2 ?? 1,
    stageOfFirstAppearanceType3: override.stageOfFirstAppearanceType3 ?? 1,
  };
}

// ---------------------------------------------------------------------------
// Word row defaults
// ---------------------------------------------------------------------------

interface WordRowOverride {
  wordInLWC?: string;
  wordInLOP?: string;
  duration?: number;
  mixedDefs?: string;
  stageOfFirstAppearance?: string;
}

export function mkWordRow(override: WordRowOverride = {}) {
  return {
    wordInLWC: override.wordInLWC ?? 'apple',
    wordInLOP: override.wordInLOP ?? 'apple',
    duration: override.duration ?? 0,
    mixedDefs: override.mixedDefs ?? '',
    stageOfFirstAppearance: override.stageOfFirstAppearance ?? '',
  };
}

// ---------------------------------------------------------------------------
// Syllable row defaults
// ---------------------------------------------------------------------------

export function mkSyllableRow(syllable = 'ap', override: Partial<{
  distractors: [string, string, string];
  audioName: string;
  duration: number;
  color: string;
}> = {}) {
  return {
    syllable,
    distractors: override.distractors ?? ['', '', ''] as [string, string, string],
    audioName: override.audioName ?? `syllable_${syllable}`,
    duration: override.duration ?? 0,
    color: override.color ?? '0',
  };
}

// ---------------------------------------------------------------------------
// Color row defaults
// ---------------------------------------------------------------------------

export function mkColorRow(index = 0) {
  return { index: String(index), hex: '#000000' };
}

// ---------------------------------------------------------------------------
// Game row defaults
// ---------------------------------------------------------------------------

export function mkGameRow(override: Partial<{
  door: number;
  country: string;
  challengeLevel: number;
  syllOrTile: string;
  instructionAudio: string;
  audioDuration: string;
}> = {}) {
  return {
    door: override.door ?? 1,
    country: override.country ?? 'UnitedStates',
    challengeLevel: override.challengeLevel ?? 1,
    syllOrTile: override.syllOrTile ?? 'T',
    instructionAudio: override.instructionAudio ?? 'naWhileMPOnly',
    audioDuration: override.audioDuration ?? '0',
  };
}

// ---------------------------------------------------------------------------
// Key row defaults
// ---------------------------------------------------------------------------

export function mkKeyRow(key = 'a', color = '0') {
  return { key, color };
}

// ---------------------------------------------------------------------------
// LangInfo factory
// ---------------------------------------------------------------------------

function mkLangInfo(entries: Array<{ label: string; value: string }> = []) {
  const map = new Map(entries.map((e) => [e.label, e.value]));
  return {
    entries,
    find: (label: string) => map.get(label),
  };
}

// ---------------------------------------------------------------------------
// Settings factory
// ---------------------------------------------------------------------------

function mkSettings(entries: Array<{ label: string; value: string }> = []) {
  const map = new Map(entries.map((e) => [e.label, e.value]));
  return {
    entries,
    find: (label: string) => map.get(label),
    findBoolean: (label: string, defaultValue: boolean): boolean => {
      const v = map.get(label);
      if (v === undefined) return defaultValue;
      return v.toLowerCase() === 'true';
    },
    findInt: (label: string, defaultValue: number): number => {
      const v = map.get(label);
      if (v === undefined) return defaultValue;
      const n = parseInt(v, 10);
      return isNaN(n) ? defaultValue : n;
    },
    findFloat: (label: string, defaultValue: number): number => {
      const v = map.get(label);
      if (v === undefined) return defaultValue;
      const n = parseFloat(v);
      return isNaN(n) ? defaultValue : n;
    },
  };
}

// ---------------------------------------------------------------------------
// ParsedPack factory
// ---------------------------------------------------------------------------

export interface ParsedPackOverride {
  tileRows?: ReturnType<typeof mkTileRow>[];
  wordRows?: ReturnType<typeof mkWordRow>[];
  syllableRows?: ReturnType<typeof mkSyllableRow>[];
  colorRows?: ReturnType<typeof mkColorRow>[];
  gameRows?: ReturnType<typeof mkGameRow>[];
  keyRows?: ReturnType<typeof mkKeyRow>[];
  langInfoEntries?: Array<{ label: string; value: string }>;
  settingsEntries?: Array<{ label: string; value: string }>;
}

export function mkParsed(override: ParsedPackOverride = {}): ParsedPack {
  return {
    tiles: {
      headers: {} as ReturnType<typeof import('@shared/util-lang-pack-parser').parseGametiles>['headers'],
      rows: override.tileRows ?? [mkTileRow()],
    },
    words: {
      headers: {} as ReturnType<typeof import('@shared/util-lang-pack-parser').parseWordlist>['headers'],
      rows: override.wordRows ?? [mkWordRow()],
    },
    syllables: {
      rows: override.syllableRows ?? [],
    },
    colors: {
      rows: override.colorRows ?? [mkColorRow(0), mkColorRow(1), mkColorRow(2)],
    },
    games: {
      rows: override.gameRows ?? [mkGameRow()],
    },
    keys: {
      rows: override.keyRows ?? [mkKeyRow('a'), mkKeyRow('b'), mkKeyRow('c')],
    },
    langInfo: mkLangInfo(override.langInfoEntries ?? [
      { label: 'Lang Name (In Local Lang)', value: 'Test' },
      { label: 'Lang Name (In English)', value: 'Test' },
      { label: 'Ethnologue code', value: 'tst' },
      { label: 'Country', value: 'TestLand' },
      { label: 'Game Name (In Local Lang)', value: 'TestGame' },
      { label: 'Script direction (LTR or RTL)', value: 'LTR' },
      { label: 'The word NAME in local language', value: 'Name' },
      { label: 'Script type', value: 'Roman' },
      { label: 'Email', value: 'test@example.com' },
      { label: 'Privacy Policy', value: 'https://example.com' },
    ]),
    settings: mkSettings(override.settingsEntries ?? []),
    names: { rows: [] },
    resources: { rows: [] },
    share: { rows: [] },
  } as unknown as ParsedPack;
}

// ---------------------------------------------------------------------------
// FileInventory factory
// ---------------------------------------------------------------------------

export function mkInventory(override: Partial<FileInventory> = {}): FileInventory {
  return {
    fonts: override.fonts ?? ['primaryFont'],
    avatars: override.avatars ?? Array.from({ length: 12 }, (_, i) => `zz_avatar${String(i + 1).padStart(2, '0')}`),
    avataricons: override.avataricons ?? Array.from({ length: 12 }, (_, i) => `zz_avataricon${String(i + 1).padStart(2, '0')}`),
    wordImages: override.wordImages ?? [],
    tileImages: override.tileImages ?? [],
    tileAudio: override.tileAudio ?? [],
    wordAudio: override.wordAudio ?? [],
    syllableAudio: override.syllableAudio ?? [],
    instructionAudio: override.instructionAudio ?? [],
    sizes: override.sizes ?? {},
    icon: override.icon,
    splash: override.splash,
  };
}
