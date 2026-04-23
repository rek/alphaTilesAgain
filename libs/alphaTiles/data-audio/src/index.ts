/**
 * Public API surface of @alphaTiles/data-audio.
 *
 * Only this file is exported from the library.
 * Internal modules (AudioContext, SoundHandle, etc.) are not re-exported.
 */

// Core preload function — called once by the loading screen.
export { preloadAudio } from './lib/preloadAudio';

// Provider — mount above all game screens after preloadAudio resolves.
export { AudioProvider } from './lib/AudioProvider';

// Primary hook — consumed by every game feature that needs audio.
export { useAudio } from './lib/useAudio';

// Web-gate component — loading screen wraps app content with this.
export { WebAudioUnlockGate } from './lib/WebAudioUnlockGate';

// Static base-chime source refs — pass as baseChimes param to preloadAudio.
export { BASE_CHIMES } from './lib/baseChimes';

// Public types.
export type { AudioConfig } from './lib/AudioConfig';
export type { AudioHandles } from './lib/AudioHandles';
