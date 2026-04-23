import type { Issue } from './Issue';

/** Aggregate counts for a validation run. */
export interface ValidationCounts {
  error: number;
  warning: number;
  info: number;
  total: number;
}

/** Full output of a `validateLangPack` call. */
export interface ValidationReport {
  issues: Issue[];
  counts: ValidationCounts;
  /** `true` iff `counts.error === 0`. Errors block the build; warnings do not. */
  ok: boolean;
}

/** Compute counts from an issue list and derive `ok`. */
export function buildReport(issues: Issue[]): ValidationReport {
  const counts: ValidationCounts = { error: 0, warning: 0, info: 0, total: issues.length };
  for (const issue of issues) {
    counts[issue.severity]++;
  }
  return { issues, counts, ok: counts.error === 0 };
}
