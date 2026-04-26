/**
 * Pure board setup for the Mexico memory game.
 *
 * Port of Mexico.java:chooseMemoryWords + Collections.shuffle:
 * 1. Pick `pairCount` distinct (by wordInLWC) random words via Java's
 *    sanity-counter dedup loop (Mexico.java:162-217). Bails to
 *    insufficient-content after pairCount*3 attempts.
 * 2. Create two CardState entries per word: one TEXT, one IMAGE.
 * 3. Shuffle the result.
 *
 * Returns { cards } on success, { error: 'insufficient-content' } when the pool
 * is too small or has too few distinct LWC entries.
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

  // Java chooseMemoryWords (Mexico.java:162-217) parity: pick a random word from the
  // full pool, reject if its wordInLWC already appears in the deck, retry via i--.
  // A sanity counter increments every iteration and bails after cardsToSetUp*3 to
  // avoid infinite loops when the pool has too few distinct LWC entries.
  const chosen: Array<{ wordInLOP: string; wordInLWC: string }> = [];
  const seenLwc = new Set<string>();
  const sanityLimit = pairCount * 3;
  let sanityCounter = 0;

  for (let i = 0; i < pairCount; i++) {
    const candidate = validMatchingWords[Math.floor(rng() * validMatchingWords.length)];
    const wordAcceptable = !seenLwc.has(candidate.wordInLWC);

    if (wordAcceptable) {
      seenLwc.add(candidate.wordInLWC);
      chosen.push(candidate);
    } else {
      i--; // Java: retry this slot
    }

    if (++sanityCounter > sanityLimit) {
      // Java goBackToEarth(null) — pool can't supply pairCount distinct LWC entries.
      return { error: 'insufficient-content' };
    }
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
