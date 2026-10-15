/**
 * Bounded LRU of live audio players (M11).
 *
 * Every live expo-audio player is an ExoPlayer + thread on Android, so keeping
 * one per clip (~400 for yue) risks OOM / thread exhaustion on low-end phones.
 * The pool keeps at most `capacity` players alive; the least-recently-used
 * idle one is evicted when a new one is added. Eviction calls `remove()` AND
 * `release()`: in expo-audio 55 `remove()` only drops the module's registry
 * entry — the native player (ExoPlayer / AVPlayer) is freed when the JS
 * SharedObject is released (`sharedObjectDidRelease`), so without `release()`
 * it would live until GC. A player that is `playing` is never evicted
 * (release stops it); the pool overflows briefly instead and catches up on the
 * next add. Evicted clips are re-created from their asset source on next play.
 *
 * Keys are opaque strings — callers namespace them per category
 * (`tile:二` vs `syllable:二`) because ids collide across categories.
 */
import type { SoundHandle } from './SoundHandle';

export function createPlayerPool({
  capacity,
  create,
}: {
  capacity: number;
  create: (source: number) => SoundHandle;
}) {
  // Map iteration order = insertion order, so the first key is the LRU one.
  const live = new Map<string, SoundHandle>();

  const touch = (key: string, handle: SoundHandle) => {
    live.delete(key);
    live.set(key, handle);
  };

  const free = (handle: SoundHandle) => {
    // Best-effort; never block playback on it.
    try {
      handle.remove();
    } catch {
      /* ignore */
    }
    try {
      handle.release();
    } catch {
      /* ignore */
    }
  };

  const isPlaying = (handle: SoundHandle) => {
    try {
      return handle.playing === true;
    } catch {
      return false;
    }
  };

  /** Evict idle LRU players; `keep` (the one just added) is never evicted. */
  const evictOverflow = (keep: string) => {
    let excess = live.size - capacity;
    if (excess <= 0) return;
    // LRU first; skip players still sounding.
    for (const [key, handle] of [...live]) {
      if (excess <= 0) return;
      if (key === keep || isPlaying(handle)) continue;
      live.delete(key);
      free(handle);
      excess--;
    }
  };

  return {
    /** Live player for `key`, creating it from `source` if evicted / never made. */
    acquire(key: string, source: number): SoundHandle {
      const existing = live.get(key);
      if (existing) {
        touch(key, existing);
        return existing;
      }
      const handle = create(source);
      touch(key, handle);
      evictOverflow(key);
      return handle;
    },
    /** Hand an already-created player to the pool (boot probe). */
    adopt(key: string, handle: SoundHandle) {
      touch(key, handle);
      evictOverflow(key);
    },
    has(key: string) {
      return live.has(key);
    },
    get size() {
      return live.size;
    },
    /** Live players, LRU first — used by the web unlock priming loop. */
    liveHandles() {
      return [...live.values()];
    },
  };
}
