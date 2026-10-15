/**
 * Settings-gate flags from aa_settings.txt.
 * When hasTileAudio is false, preloadAudio skips tile loading
 * and tile speech is silent (warn-once).
 * Same rule for hasSyllableAudio / syllable speech.
 */
export type AudioConfig = {
  hasTileAudio: boolean;
  hasSyllableAudio: boolean;
};
