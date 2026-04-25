/**
 * BASE_CHIMES — module-level constant pointing at the app-shell audio files.
 *
 * These three clips ship with the app (not with language packs) and are
 * identical across all builds. They live in data-audio/assets/.
 *
 * Metro requires static require() literals — no dynamic paths here.
 */

export const BASE_CHIMES = {
  correct: require('../../assets/correct.mp3') as number,
  incorrect: require('../../assets/incorrect.mp3') as number,
  correctFinal: require('../../assets/correctFinal.mp3') as number,
} as const;
