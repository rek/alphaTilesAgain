/**
 * Thrown by any parser in util-lang-pack-parser when input is structurally
 * malformed (wrong column count, duplicate label, invalid enum value, etc.).
 *
 * Parsers throw immediately on the first structural defect — they do not
 * accumulate errors. If you need an error report, use util-lang-pack-validator.
 */
export class LangPackParseError extends Error {
  readonly file: string;
  /** 1-based line number (header = line 1). */
  readonly line: number;
  /** Expected column count (present when the error is a column-count mismatch). */
  readonly expected: number | undefined;
  /** Actual column count received. */
  readonly got: number | undefined;
  /** Column name when the error targets a specific field. */
  readonly column: string | undefined;
  /** Short human hint — e.g. 'integer expected', 'duplicate label', 'expected T or S'. */
  readonly reason: string | undefined;

  constructor(fields: {
    file: string;
    line: number;
    expected?: number;
    got?: number;
    column?: string;
    reason?: string;
  }) {
    const parts: string[] = [`[${fields.file}] line ${fields.line}`];
    if (fields.column !== undefined) {
      parts.push(`column "${fields.column}"`);
    }
    if (fields.expected !== undefined && fields.got !== undefined) {
      parts.push(`expected ${fields.expected} columns, got ${fields.got}`);
    }
    if (fields.reason !== undefined) {
      parts.push(fields.reason);
    }
    super(parts.join(' — '));
    this.name = 'LangPackParseError';
    this.file = fields.file;
    this.line = fields.line;
    this.expected = fields.expected;
    this.got = fields.got;
    this.column = fields.column;
    this.reason = fields.reason;
  }
}
