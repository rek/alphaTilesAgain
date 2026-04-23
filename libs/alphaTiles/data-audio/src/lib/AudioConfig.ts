/**
 * Settings-gate flags from aa_settings.txt.
 * When hasTileAudio is false, preloadAudio skips tile loading
 * and playTile becomes a no-op warning.
 * Same rule for hasSyllableAudio / playSyllable.
 */
export type AudioConfig = {
  hasTileAudio: boolean;
  hasSyllableAudio: boolean;
};
