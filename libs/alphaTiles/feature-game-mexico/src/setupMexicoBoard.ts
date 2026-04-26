/**
 * Pure board setup for the Mexico memory game.
 *
 * Port of Mexico.java:chooseMemoryWords + Collections.shuffle:
 * 1. Pick `pairCount` random distinct words from validMatchingWords.
 * 2. Create two CardState entries per word: one TEXT, one IMAGE.
 * 3. Shuffle the result.
 *
 * Returns { cards } on success, { error: 'insufficient-content' } when the pool
 * is too small.
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
  if (validMatchingWords.length < pairCount) {
    return { error: 'insufficient-content' };
  }

  // TODO(mexico-spec-drift): Java's chooseMemoryWords (Mexico.java:162-217) dedupes
  // by wordInLWC at draw time with a sanity counter (cardsToSetUp * 3 retries) before
  // bailing to goBackToEarth(null). We rely on validMatchingWords being unique by LWC
  // (true if wordlist rows are unique). If a pack ships duplicates, we'd silently emit
  // duplicate pairs instead of retrying. Promote dedup here if that ever surfaces.

  // Pick `pairCount` distinct words (Fisher-Yates partial shuffle)
  const pool = [...validMatchingWords];
  const chosen: Array<{ wordInLOP: string; wordInLWC: string }> = [];

  for (let i = 0; i < pairCount; i++) {
    const remaining = pool.length - i;
    const pick = i + Math.floor(rng() * remaining);
    // Swap chosen position with pick
    const tmp = pool[i];
    pool[i] = pool[pick];
    pool[pick] = tmp;
    chosen.push(pool[i]);
  }

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
