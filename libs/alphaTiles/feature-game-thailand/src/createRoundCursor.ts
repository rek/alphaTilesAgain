/**
 * Fixed-order question cursor for one Thailand door (issue #17 / M10).
 *
 * `show()` returns the index to display and persists THAT index, so leaving
 * mid-question resumes on the same question. `answered()` persists the next
 * index once the displayed question is answered correctly. The advance arrow
 * (skip) is just another `show()`.
 */
export function createRoundCursor(start: number, persist: (cursor: number) => void) {
  let next = start;
  let shown = start;
  return {
    show(): number {
      shown = next;
      next = shown + 1;
      persist(shown);
      return shown;
    },
    answered(): void {
      persist(shown + 1);
    },
  };
}
