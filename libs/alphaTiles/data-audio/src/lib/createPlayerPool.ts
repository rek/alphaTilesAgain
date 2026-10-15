/**
 * Bounded LRU of live audio players (M11).
 *
 * Every live expo-audio player is an ExoPlayer + thread on Android, so keeping
 * one per clip (~400 for yue) risks OOM / thread exhaustion on low-end phones.
 * The pool keeps at most `capacity` players alive; the least-recently-used one
 * is `remove()`d when a new one is added. Evicted clips are re-created from
 * their asset source on next play.
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

  const evictOverflow = () => {
    while (live.size > capacity) {
      const oldest = live.keys().next();
      if (oldest.done) return;
      const handle = live.get(oldest.value);
      live.delete(oldest.value);
      try {
        handle?.remove();
      } catch {
        // Releasing a player is best-effort; never block playback on it.
      }
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
      evictOverflow();
      return handle;
    },
    /** Hand an already-created player to the pool (boot probe). */
    adopt(key: string, handle: SoundHandle) {
      touch(key, handle);
      evictOverflow();
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
