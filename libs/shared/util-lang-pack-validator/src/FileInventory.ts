/**
 * Listing of files present on disk under `languages/<code>/`.
 *
 * All basenames are WITHOUT extension (to match the audioName/image-key
 * convention in aa_*.txt files). The CLI walks the filesystem to produce this;
 * tests mock it directly.
 *
 * `sizes` maps basename (without ext) to file size in bytes — needed for
 * zero-byte and oversize audio checks (4.10.6 / 4.10.7).
 */
export interface FileInventory {
  fonts: string[];             // basenames under fonts/
  avatars: string[];           // basenames under images/avatars/
  avataricons: string[];       // basenames under images/avataricons/
  wordImages: string[];        // basenames under images/words/ (with extension stripped)
  tileImages: string[];        // basenames under images/tiles/
  tileAudio: string[];         // basenames under audio/tiles/
  wordAudio: string[];         // basenames under audio/words/
  syllableAudio: string[];     // basenames under audio/syllables/
  instructionAudio: string[];  // basenames under audio/instructions/
  /** sizes[basename] = bytes — optional but required for size checks */
  sizes?: Record<string, number>;
  /** if images/icon.png exists */
  icon?: string;
  /** if images/splash.png exists */
  splash?: string;
}
