/**
 * Restart a live player from zero. Never throws (logs in dev).
 *
 * Platform strategy (design D4):
 *   Native: seekTo(0) + play() — SoundPool-equivalent replay.
 *   Web: pause() + seekTo(0) then play() (last-play-wins single-instance).
 */
import { Platform } from 'react-native';
import type { SoundHandle } from './SoundHandle';

export async function playHandle(handle: SoundHandle): Promise<void> {
  try {
    if (Platform.OS === 'web') handle.pause();
    await handle.seekTo(0);
    handle.play();
  } catch (err) {
    if (__DEV__) {
      console.warn('[data-audio] playHandle error:', err instanceof Error ? err.message : String(err));
    }
  }
}
