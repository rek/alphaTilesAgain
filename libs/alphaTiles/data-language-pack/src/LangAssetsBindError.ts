/**
 * Thrown when a lang-pack asset (audio/image/font) referenced in an aa_*.txt
 * file is absent from the bundled manifest.
 *
 * In a healthy build the validator catches this first; reaching this error at
 * runtime means either the validator was bypassed or the manifest generator has
 * a bug. The message says so explicitly.
 *
 * See design.md §D3 and §D8.
 */

export type LangAssetsBindErrorCategory =
  | 'tile-audio'
  | 'word-audio'
  | 'syllable-audio'
  | 'instruction-audio'
  | 'tile-image'
  | 'word-image'
  | 'font'
  | 'avatar';

export class LangAssetsBindError extends Error {
  readonly category: LangAssetsBindErrorCategory;
  /** The manifest key that was absent (e.g. 'zz_a', 'act'). */
  readonly key: string;
  /** Optional human hint appended to message. */
  readonly reason: string | undefined;

  constructor(fields: {
    category: LangAssetsBindErrorCategory;
    key: string;
    reason?: string;
  }) {
    const hint =
      'This is a build-pipeline bug; the validator should have caught this.';
    const base = `Pack asset missing: ${fields.category} — key "${fields.key}". ${hint}`;
    super(fields.reason !== undefined ? `${base} (${fields.reason})` : base);
    this.name = 'LangAssetsBindError';
    this.category = fields.category;
    this.key = fields.key;
    this.reason = fields.reason;
  }
}
