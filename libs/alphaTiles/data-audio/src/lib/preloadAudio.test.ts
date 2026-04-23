/**
 * preloadAudio unit tests.
 *
 * expo-audio is mocked via moduleNameMapper (jest.config.ts).
 * The mock exports createAudioPlayer and setAudioModeAsync as jest.fn().
 * We spy on them and control return values per test.
 *
 * Verifies:
 *   - keyed map construction and size
 *   - settings-gated skipping (hasTileAudio: false, hasSyllableAudio: false)
 *   - per-file error isolation (null handle, warning, rest succeeds)
 *   - duration cache population (seconds → milliseconds)
 *   - onProgress callback invocation count
 */

// Must import the mocked module before preloadAudio so spies work.
import * as expoAudio from 'expo-audio';
import { preloadAudio } from './preloadAudio';

// ── Mock handle factory ───────────────────────────────────────────────────────

function makeMockPlayer(durationSeconds = 1.5) {
  return {
    isLoaded: true,
    duration: durationSeconds,
    volume: 1,
    playing: false,
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn(),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeManifest(
  tileKeys: string[],
  wordKeys: string[],
  syllableKeys: string[] = [],
  instructionKeys: string[] = []
) {
  const toRecord = (keys: string[]) =>
    Object.fromEntries(keys.map((k, i) => [k, i + 100])) as Record<string, number>;
  return {
    tiles: toRecord(tileKeys),
    words: toRecord(wordKeys),
    syllables: toRecord(syllableKeys),
    instructions: toRecord(instructionKeys),
  };
}

const BASE_CHIMES = { correct: 1, incorrect: 2, correctFinal: 3 } as const;

// ── Setup ─────────────────────────────────────────────────────────────────────

let createPlayerSpy: jest.SpyInstance;
let setAudioModeSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  createPlayerSpy = jest
    .spyOn(expoAudio, 'createAudioPlayer')
    .mockImplementation(() => makeMockPlayer() as never);
  setAudioModeSpy = jest
    .spyOn(expoAudio, 'setAudioModeAsync')
    .mockResolvedValue(undefined);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('preloadAudio — full successful preload', () => {
  it('returns maps with correct sizes', async () => {
    const manifest = makeManifest(
      ['a', 'b', 'c', 'd', 'e'],  // 5 tiles
      ['act', 'ant', 'arm'],       // 3 words
      [],
      ['intro']                    // 1 instruction
    );

    const handles = await preloadAudio({
      manifest,
      audioConfig: { hasTileAudio: true, hasSyllableAudio: false },
      baseChimes: BASE_CHIMES,
    });

    expect(handles.tiles.size).toBe(5);
    expect(handles.words.size).toBe(3);
    expect(handles.syllables.size).toBe(0);
    expect(handles.instructions.size).toBe(1);
    expect(handles.chimes.correct).toBeDefined();
    expect(handles.chimes.incorrect).toBeDefined();
    expect(handles.chimes.correctFinal).toBeDefined();
  });

  it('populates duration cache in milliseconds (seconds × 1000)', async () => {
    createPlayerSpy.mockImplementation(() => makeMockPlayer(2.3) as never);

    const manifest = makeManifest(['a'], ['act']);
    const handles = await preloadAudio({
      manifest,
      audioConfig: { hasTileAudio: true, hasSyllableAudio: false },
      baseChimes: BASE_CHIMES,
    });

    expect(handles.durations.get('a')).toBe(2300);
    expect(handles.durations.get('act')).toBe(2300);
  });

  it('calls setAudioModeAsync with playsInSilentMode: true', async () => {
    const manifest = makeManifest([], ['act']);
    await preloadAudio({
      manifest,
      audioConfig: { hasTileAudio: false, hasSyllableAudio: false },
      baseChimes: BASE_CHIMES,
    });

    expect(setAudioModeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ playsInSilentMode: true })
    );
  });
});

describe('preloadAudio — hasTileAudio: false', () => {
  it('skips tile loading; tile map is empty', async () => {
    const manifest = makeManifest(['a', 'b'], ['act', 'ant']);

    const handles = await preloadAudio({
      manifest,
      audioConfig: { hasTileAudio: false, hasSyllableAudio: false },
      baseChimes: BASE_CHIMES,
    });

    expect(handles.tiles.size).toBe(0);
    expect(handles.words.size).toBe(2);
  });

  it('does not call createAudioPlayer for tile sources when disabled', async () => {
    const manifest = makeManifest(['a', 'b'], ['act']);

    await preloadAudio({
      manifest,
      audioConfig: { hasTileAudio: false, hasSyllableAudio: false },
      baseChimes: BASE_CHIMES,
    });

    // Should only create: 1 word + 3 chimes = 4 calls
    expect(createPlayerSpy).toHaveBeenCalledTimes(4);
  });
});

describe('preloadAudio — hasSyllableAudio: false', () => {
  it('skips syllable loading; syllable map is empty', async () => {
    const manifest = makeManifest([], ['act'], ['syl1', 'syl2']);

    const handles = await preloadAudio({
      manifest,
      audioConfig: { hasTileAudio: true, hasSyllableAudio: false },
      baseChimes: BASE_CHIMES,
    });

    expect(handles.syllables.size).toBe(0);
  });
});

describe('preloadAudio — per-file error handling', () => {
  it('records null for failing file, warns, rest succeeds', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    // source 101 → index 1 → key 'b' in tiles ['a','b','c']
    createPlayerSpy.mockImplementation((source: number) => {
      if (source === 101) throw new Error('file not found');
      return makeMockPlayer() as never;
    });

    const manifest = makeManifest(['a', 'b', 'c'], ['act']);

    const handles = await preloadAudio({
      manifest,
      audioConfig: { hasTileAudio: true, hasSyllableAudio: false },
      baseChimes: BASE_CHIMES,
    });

    expect(handles.tiles.size).toBe(3);
    expect(handles.tiles.get('a')).not.toBeNull();
    expect(handles.tiles.get('b')).toBeNull();
    expect(handles.tiles.get('c')).not.toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

describe('preloadAudio — onProgress callback', () => {
  it('calls onProgress for each loaded item up to total', async () => {
    const onProgress = jest.fn();
    const manifest = makeManifest(['a', 'b'], ['act']);

    await preloadAudio({
      manifest,
      audioConfig: { hasTileAudio: true, hasSyllableAudio: false },
      baseChimes: BASE_CHIMES,
      onProgress,
    });

    // tiles:2 + words:1 + chimes:3 = 6 calls
    expect(onProgress).toHaveBeenCalledTimes(6);
    // Last call: (6, 6)
    const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1];
    expect(lastCall[0]).toBe(6);
    expect(lastCall[1]).toBe(6);
  });
});

describe('preloadAudio — large input (concurrency bound)', () => {
  it('completes with correct map sizes for 20 tile inputs', async () => {
    const tiles = Array.from({ length: 20 }, (_, i) => `tile${i}`);
    const manifest = makeManifest(tiles, []);

    const handles = await preloadAudio({
      manifest,
      audioConfig: { hasTileAudio: true, hasSyllableAudio: false },
      baseChimes: BASE_CHIMES,
    });

    expect(handles.tiles.size).toBe(20);
    // All handles should be non-null since mock always succeeds
    let nullCount = 0;
    handles.tiles.forEach((h) => { if (h === null) nullCount++; });
    expect(nullCount).toBe(0);
  });
});
