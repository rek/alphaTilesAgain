import { setEnabled } from './analyticsRegistry';

/**
 * Gate analytics firing. Default is `false` (design.md D9).
 *
 * Called once at boot by `data-language-assets` after parsing
 * `aa_settings.txt`'s `"Send analytics"` row:
 *   setAnalyticsEnabled(parsedSettings.sendAnalytics);
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  setEnabled(enabled);
}
