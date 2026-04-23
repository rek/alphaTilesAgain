import { shouldIncrementTracker } from './noTrackerCountries';

export function computeTrackerCount(
  previous: number,
  isCorrect: boolean,
  country: string,
): number {
  if (isCorrect && shouldIncrementTracker(country)) {
    return previous + 1;
  }
  return previous;
}
