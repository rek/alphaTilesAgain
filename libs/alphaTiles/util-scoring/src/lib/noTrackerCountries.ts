export const NO_TRACKER_COUNTRIES = ['Romania', 'Sudan', 'Malaysia', 'Iraq'] as const;
export type NoTrackerCountry = (typeof NO_TRACKER_COUNTRIES)[number];

export function shouldIncrementTracker(country: string): boolean {
  return !NO_TRACKER_COUNTRIES.includes(country as NoTrackerCountry);
}
