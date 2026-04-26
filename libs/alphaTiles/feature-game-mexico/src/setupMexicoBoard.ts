/**
 * Pure board setup for the Mexico memory game.
 *
 * Port of Mexico.java:chooseMemoryWords + Collections.shuffle:
 * 1. Dedupe the pool by `wordInLWC` (Java's i-- retry loop dedupes implicitly),
 *    bail to insufficient-content if fewer than `pairCount` distinct entries.
 * 2. Fisher-Yates partial shuffle to pick `pairCount` distinct words.
 * 3. Create two CardState entries per word: one TEXT, one IMAGE.
 * 4. Shuffle the result.
 *
 * Java port note: the Java loop samples-with-rejection bounded by a
 * `cardsToSetUp * 3` sanity counter. With `pool.length === pairCount` that
 * counter sits at the coupon-collector boundary (~50% bail rate), which would
 * spuriously surface "insufficient content" to users with edge-case packs.
 * Up-front dedupe + partial shuffle yields the same result set with O(N) work
 * and zero false-bail probability — preferred over verbatim Java parity.
 *
 * Returns { cards } on success, { error: 'insufficient-content' } when the pool
 * has too few distinct LWC entries.
 */

export type CardMode = 'TEXT' | 'IMAGE';
export type CardStatus = 'HIDDEN' | 'REVEALED' | 'PAIRED';

export type CardState = {
  word: { wordInLOP: string; wordInLWC: string };
  mode: CardMode;
  status: CardStatus;
  /** Per-pair theme color hex; assigned on PAIRED transition (Mexico.java:307 colorList[cardHitA % 5]). */
  pairedColor?: string;
};

type SetupResult =
  | { cards: CardState[] }
  | { error: 'insufficient-content' };

export function setupMexicoBoard(
  validMatchingWords: ReadonlyArray<{ wordInLOP: string; wordInLWC: string }>,
  pairCount: number,
  rng: () => number = Math.random,
): SetupResult {
  // Dedupe by wordInLWC — first occurrence wins (matches Java's i-- retry,
  // which keeps the first sampled entry per LWC and rejects later duplicates).
  const seenLwc = new Set<string>();
  const distinctPool: Array<{ wordInLOP: string; wordInLWC: string }> = [];
  for (const w of validMatchingWords) {
    if (seenLwc.has(w.wordInLWC)) continue;
    seenLwc.add(w.wordInLWC);
    distinctPool.push(w);
  }

  if (distinctPool.length < pairCount) {
    // Java goBackToEarth(null) — pool can't supply pairCount distinct LWC entries.
    return { error: 'insufficient-content' };
  }

  // Fisher-Yates partial shuffle: pick `pairCount` distinct words.
  for (let i = 0; i < pairCount; i++) {
    const j = i + Math.floor(rng() * (distinctPool.length - i));
    const tmp = distinctPool[i];
    distinctPool[i] = distinctPool[j];
    distinctPool[j] = tmp;
  }
  const chosen = distinctPool.slice(0, pairCount);

  // Create pairs
  const pairs: CardState[] = [];
  for (const word of chosen) {
    pairs.push({ word, mode: 'TEXT', status: 'HIDDEN' });
    pairs.push({ word, mode: 'IMAGE', status: 'HIDDEN' });
  }

  // Shuffle (Fisher-Yates)
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pairs[i];
    pairs[i] = pairs[j];
    pairs[j] = tmp;
  }

  return { cards: pairs };
}
