/**
 * primeAudioHandles — unlock every loaded clip inside a user-gesture frame.
 *
 * Safari/iOS need EACH <audio> element's first play() to come from a gesture
 * (issue #25); Chrome only needs one gesture on the page (sticky activation).
 *
 * Chunked (#47): play()+pause() on all ~430 yue clips in one task killed the
 * Chromium tab (threshold ~250–350 elements in headless Chrome). The first
 * chunk runs synchronously in the gesture task; the rest follow on short
 * timers, finishing well inside WebKit's 1 s user-gesture forwarding window
 * for timers scheduled from a gesture.
 *
 * expo-audio's web player exposes its HTMLMediaElement as `media`. When present
 * we prime that directly and swallow the play() promise: a play() interrupted by
 * pause() rejects with AbortError, which would otherwise log one "Uncaught (in
 * promise)" console error per clip (~400 for yue). Capability check, not a
 * platform check (design D6).
 */
import type { AudioHandles } from './AudioHandles';
import type { SoundHandle } from './SoundHandle';

type MediaLike = {
  muted: boolean;
  play: () => Promise<void> | void;
  pause: () => void;
};

function mediaOf(handle: SoundHandle): MediaLike | null {
  const media = (handle as unknown as { media?: unknown }).media;
  if (
    typeof media === 'object' &&
    media !== null &&
    typeof (media as MediaLike).play === 'function' &&
    typeof (media as MediaLike).pause === 'function'
  ) {
    return media as MediaLike;
  }
  return null;
}

function primeOne(handle: SoundHandle) {
  try {
    const media = mediaOf(handle);
    if (media) {
      const wasMuted = media.muted;
      media.muted = true;
      const pending = media.play();
      media.pause();
      media.muted = wasMuted;
      if (pending && typeof pending.catch === 'function') {
        pending.catch(() => undefined);
      }
      return;
    }
    const originalVolume = handle.volume;
    handle.volume = 0;
    handle.play();
    handle.pause();
    handle.volume = originalVolume;
  } catch {
    // Per-handle priming failure is non-fatal; keep going.
  }
}

const PRIME_CHUNK_SIZE = 40;
const PRIME_CHUNK_INTERVAL_MS = 30;

/**
 * Primes chimes first, then instructions, tiles, syllables, words.
 * Returns the number of non-null handles scheduled for priming.
 */
export function primeAudioHandles(handles: AudioHandles) {
  const queue: SoundHandle[] = [
    handles.chimes.correct,
    handles.chimes.incorrect,
    handles.chimes.correctFinal,
  ];
  for (const map of [handles.instructions, handles.tiles, handles.syllables, handles.words]) {
    for (const h of map.values()) if (h) queue.push(h);
  }

  const runChunk = (start: number) => {
    for (const h of queue.slice(start, start + PRIME_CHUNK_SIZE)) primeOne(h);
  };

  runChunk(0);
  for (let start = PRIME_CHUNK_SIZE, i = 1; start < queue.length; start += PRIME_CHUNK_SIZE, i++) {
    setTimeout(() => runChunk(start), i * PRIME_CHUNK_INTERVAL_MS);
  }
  return queue.length;
}
