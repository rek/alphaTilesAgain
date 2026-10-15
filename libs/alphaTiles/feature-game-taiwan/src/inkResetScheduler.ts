/**
 * Single-slot debounced scheduler used to wipe the learner's rejected-stroke
 * ink (issue #31). Upstream `UserStrokeGesture` fades ink via a reanimated
 * `withTiming` completion callback; when that callback is missed or races a new
 * gesture the black ink stays on screen and piles up. We backstop it by
 * remounting the writer surface (`inkKey`) shortly after each mistake.
 *
 * Debounced: each `schedule()` replaces the pending reset so a learner who
 * retries quickly is not interrupted mid-stroke.
 */
export type InkResetScheduler = {
  schedule: () => void;
  cancel: () => void;
};

export function createInkResetScheduler(delayMs: number, onReset: () => void): InkResetScheduler {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return {
    cancel,
    schedule() {
      cancel();
      timer = setTimeout(() => {
        timer = null;
        onReset();
      }, delayMs);
    },
  };
}
