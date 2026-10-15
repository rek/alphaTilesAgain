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

// Chimes + load/unlock lifecycle.
export { useAudio } from './lib/useAudio';

// Pack speech — the only way to play tiles / words / syllables / instructions.
export { usePackSpeech } from './lib/usePackSpeech';
export type { SpeechItem } from './lib/planSpeech';


// Static base-chime source refs — pass as baseChimes param to preloadAudio.
export { BASE_CHIMES } from './lib/baseChimes';

// Public types.
export type { AudioConfig } from './lib/AudioConfig';
export type { AudioHandles } from './lib/AudioHandles';
