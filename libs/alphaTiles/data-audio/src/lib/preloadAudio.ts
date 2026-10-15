/**
 * preloadAudio — probes every audio clip once (duration + load check) and
 * keeps a bounded pool of live players.
 *
 * Called once by the loading screen after the language manifest resolves.
 * Durations are measured up front so useAudio's duration getters stay
 * synchronous (the shell picks word clip vs syllable chain from them).
 *
 * M11: players are NOT kept per clip. Each probed player is handed to an LRU
 * pool capped at `livePlayerLimit` (native default 24); older idle ones are
 * released (native player freed) and re-created on demand by useAudio. Peak live players ≈
 * limit + 4 × CONCURRENCY + 3 chimes instead of one per clip (~400 for yue).
 * Web keeps every player (limit Infinity): Safari only unlocks <audio>
 * elements primed inside the user gesture (issue #25), so a player created
 * later would be silent.
 *
 * Concurrency is bounded to 8 simultaneous loads (design D3 / ADR-007 impl notes)
 * to avoid iOS resource limits.
 *
 * Per-file errors are caught, logged, and recorded as null handles so the rest
 * of the app can boot (design risk mitigation).
 */
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';
import { createPlayerPool } from './createPlayerPool';
import type { AudioConfig } from './AudioConfig';
import type { AudioHandles } from './AudioHandles';
import type { SoundHandle } from './SoundHandle';

type AudioManifest = {
  tiles: Record<string, number>;
  words: Record<string, number>;
  syllables: Record<string, number>;
  instructions: Record<string, number>;
};

type BaseChimes = {
  correct: number;
  incorrect: number;
  correctFinal: number;
};

type PreloadAudioParams = {
  manifest: AudioManifest;
  audioConfig: AudioConfig;
  baseChimes: BaseChimes;
  onProgress?: (loaded: number, total: number) => void;
  batchEvery?: number;
  /** Max live players kept after boot. Default: 24 native, Infinity web. */
  livePlayerLimit?: number;
};

const CONCURRENCY = 8;
const NATIVE_LIVE_PLAYER_LIMIT = 24;

/** Simple semaphore to bound concurrent createAudioPlayer calls. */
async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
  onItemDone?: () => void
): Promise<(T | null)[]> {
  const results: (T | null)[] = new Array(tasks.length).fill(null);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const i = nextIndex++;
      try {
        results[i] = await tasks[i]();
      } catch {
        results[i] = null;
      }
      onItemDone?.();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function loadHandle(source: number, key: string): Promise<SoundHandle> {
  try {
    const player = createAudioPlayer(source);
    // Wait briefly for the player to load so duration is available.
    // expo-audio sets duration synchronously for local assets on native;
    // on web it may need a tick. We poll isLoaded up to 3s.
    await waitForLoaded(player);
    return player;
  } catch (err) {
    console.warn(
      `[data-audio] Failed to load audio: ${key}`,
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  }
}

function waitForLoaded(player: SoundHandle): Promise<void> {
  return new Promise((resolve) => {
    if (player.isLoaded) {
      resolve();
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (player.isLoaded || Date.now() - start > 3000) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}

async function loadCategory(
  category: string,
  entries: [string, number][],
  durations: Map<string, number>,
  pool: ReturnType<typeof createPlayerPool>,
  onItemDone?: () => void
): Promise<Map<string, number | null>> {
  const map = new Map<string, number | null>();
  if (entries.length === 0) return map;

  const keys = entries.map(([k]) => k);
  const tasks = entries.map(([key, source]) => async () => {
    const handle = await loadHandle(source, key);
    // duration is in seconds for expo-audio; cache as milliseconds.
    const durationMs = handle.isLoaded ? Math.round(handle.duration * 1000) : 0;
    if (durationMs > 0) {
      durations.set(key, durationMs);
    }
    // Pool may evict (release) it straight away — only the source is kept.
    pool.adopt(`${category}:${key}`, handle);
    return source;
  });

  const results = await withConcurrencyLimit(tasks, CONCURRENCY, onItemDone);

  results.forEach((source, i) => {
    if (source === null) {
      console.warn(`[data-audio] Null handle for key: ${keys[i]}`);
    }
    map.set(keys[i], source);
  });

  return map;
}

export async function preloadAudio({
  manifest,
  audioConfig,
  baseChimes,
  onProgress,
  batchEvery = 10,
  livePlayerLimit = Platform.OS === 'web' ? Infinity : NATIVE_LIVE_PLAYER_LIMIT,
}: PreloadAudioParams): Promise<AudioHandles> {
  // D1 — iOS silent mode override so audio plays with the silent switch engaged.
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {
    // Non-fatal — Android ignores this key; web may not support it.
    if (__DEV__) {
      console.warn('[data-audio] setAudioModeAsync failed (non-fatal)');
    }
  }

  // Separate map per category — keys collide across categories (L4).
  const durations = {
    tiles: new Map<string, number>(),
    words: new Map<string, number>(),
    syllables: new Map<string, number>(),
    instructions: new Map<string, number>(),
  };

  // Count total load targets for progress reporting.
  const tileEntries = audioConfig.hasTileAudio ? Object.entries(manifest.tiles) : [];
  const syllableEntries = audioConfig.hasSyllableAudio ? Object.entries(manifest.syllables) : [];
  const wordEntries = Object.entries(manifest.words);
  const instructionEntries = Object.entries(manifest.instructions);
  const chimeCount = 3;

  const total =
    tileEntries.length + syllableEntries.length + wordEntries.length + instructionEntries.length + chimeCount;
  let loaded = 0;

  const itemDone = () => {
    loaded++;
    onProgress?.(loaded, total);
  };

  const pool = createPlayerPool({ capacity: livePlayerLimit, create: createAudioPlayer });

  // Categories probe in parallel, each bounded by CONCURRENCY, so at most
  // 4 × CONCURRENCY probe players exist beyond the pool at any moment.
  const [tilesMap, wordsMap, syllablesMap, instructionsMap] = await Promise.all([
    loadCategory('tile', tileEntries, durations.tiles, pool, itemDone),
    loadCategory('word', wordEntries, durations.words, pool, itemDone),
    loadCategory('syllable', syllableEntries, durations.syllables, pool, itemDone),
    loadCategory('instruction', instructionEntries, durations.instructions, pool, itemDone),
  ]);

  // Load base chimes (D5 — ship with the app, not the pack).
  // Chimes are always-required — failure is fatal (rethrow).
  async function loadRequiredChime(source: number, name: string): Promise<SoundHandle> {
    try {
      const handle = await loadHandle(source, `chime:${name}`);
      itemDone();
      return handle;
    } catch {
      console.warn(`[data-audio] Failed to load base chime: ${name}`);
      throw new Error(`[data-audio] Required base chime "${name}" failed to load`);
    }
  }

  const correctHandle = await loadRequiredChime(baseChimes.correct, 'correct');
  const incorrectHandle = await loadRequiredChime(baseChimes.incorrect, 'incorrect');
  const correctFinalHandle = await loadRequiredChime(baseChimes.correctFinal, 'correctFinal');

  void batchEvery; // parameter reserved for future batch-progress tuning

  return {
    tiles: tilesMap,
    words: wordsMap,
    syllables: syllablesMap,
    instructions: instructionsMap,
    pool,
    chimes: {
      correct: correctHandle,
      incorrect: incorrectHandle,
      correctFinal: correctFinalHandle,
    },
    durations,
  };
}
