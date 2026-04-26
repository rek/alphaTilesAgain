/**
 * Fisher-Yates in-place shuffle. Returns the input array.
 *
 * Used to mirror `Collections.shuffle(syllableListCopy)` (Java ~129, ~153).
 */
export function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
