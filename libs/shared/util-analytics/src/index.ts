// Event catalog
export type { AnalyticsEvent } from './lib/analyticsEvent';

// Adapter type (for v2 implementors)
export type { AnalyticsAdapter } from './lib/analyticsAdapter';

// Core call functions
export { track } from './lib/track';
export { identify } from './lib/identify';
export { screen } from './lib/screen';

// Adapter swap + settings gate
export { setAnalyticsAdapter } from './lib/setAnalyticsAdapter';
export { setAnalyticsEnabled } from './lib/setAnalyticsEnabled';

// Wire format helper (for adapter authors)
export { transformPropsToSnake } from './lib/transformPropsToSnake';

// Screen-view hook for containers
export { useTrackScreenMount } from './lib/useTrackScreenMount';
