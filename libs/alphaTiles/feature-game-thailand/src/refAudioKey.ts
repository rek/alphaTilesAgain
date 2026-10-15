import type { ThailandRef } from './setupThailandRound';

/**
 * Audio-map key for a Thailand reference. Must match the keys
 * `resolveAudio` binds (data-language-pack/src/internal/resolveAudio.ts):
 * tiles by `tile.base`, words by `wordInLWC`, syllables by `syllable` —
 * NOT the pack's AudioName column (yue tile `醫生` → audio `zz_doctor`).
 */
export function refAudioKey(ref: ThailandRef) {
  if (ref.kind === 'tile') return { category: 'tile' as const, key: ref.tileRow.base };
  if (ref.kind === 'word') return { category: 'word' as const, key: ref.wordRow.wordInLWC };
  return { category: 'syllable' as const, key: ref.syllableRow.syllable };
}
