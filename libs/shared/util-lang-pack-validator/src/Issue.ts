/** Severity levels matching Java validator's fatalErrors / warnings / recommendations. */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * A single validation issue emitted by any check function.
 *
 * Java reference: Message.java — the TS port uses a richer shape with stable
 * `code` identifiers, `category` grouping, and optional structured `context`.
 */
export interface Issue {
  severity: IssueSeverity;
  /** Stable string identifier — e.g. 'MISSING_TILE_AUDIO'. Declared in issueCodes.ts. */
  code: string;
  /** Check-category name segment — e.g. 'audio-reference'. Matches the check filename. */
  category: string;
  /** Human-readable message including the specific bad value. */
  message: string;
  /** Source file name — e.g. 'aa_gametiles.txt'. Optional. */
  file?: string;
  /** 1-based line number in the source file. Optional. */
  line?: number;
  /** Column name — e.g. 'AudioName'. Optional. */
  column?: string;
  /** Optional structured payload for downstream tooling (IDE integration, etc.). */
  context?: Record<string, unknown>;
}
