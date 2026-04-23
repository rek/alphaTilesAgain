/**
 * Minimal type declarations for expo-updates.
 * Replace with the real package types once `expo-updates` is installed
 * (`npm install expo-updates` in apps/alphaTiles).
 *
 * See openspec/changes/ota-updates/design.md D2, D9.
 */
declare module 'expo-updates' {
  /** Whether expo-updates is enabled for this build (false in dev). */
  export const isEnabled: boolean;

  /** The OTA channel this binary was built for (e.g. "eng", "tpx"). */
  export const channel: string | undefined;

  /** The update ID currently running, or null on a fresh install. */
  export const updateId: string | null;

  export interface UpdateCheckResult {
    isAvailable: boolean;
    updateId?: string;
  }

  export interface UpdateFetchResult {
    isNew: boolean;
  }

  /** Check for an available update on the binary's channel. */
  export function checkForUpdateAsync(): Promise<UpdateCheckResult>;

  /** Download the available update bundle. */
  export function fetchUpdateAsync(): Promise<UpdateFetchResult>;

  /** Reload the app to apply the downloaded update. Never returns on success. */
  export function reloadAsync(): Promise<void>;
}
