/**
 * BASE_CHIMES — module-level constant pointing at the app-shell audio files.
 *
 * These three clips ship with the app (not with language packs) and are
 * identical across all builds. They live at apps/alphaTiles/assets/audio/.
 *
 * Path resolution: from libs/alphaTiles/data-audio/src/lib/ the relative
 * path is ../../../../../apps/alphaTiles/assets/audio/.
 * This is the one place data-audio reaches into apps/ — justified by design
 * decision D5: base chimes are an app-level asset by definition.
 *
 * Metro requires static require() literals — no dynamic paths here.
 */

export const BASE_CHIMES = {
  correct: require('../../../../../apps/alphaTiles/assets/audio/correct.mp3') as number,
  incorrect: require('../../../../../apps/alphaTiles/assets/audio/incorrect.mp3') as number,
  correctFinal: require('../../../../../apps/alphaTiles/assets/audio/correctFinal.mp3') as number,
} as const;
