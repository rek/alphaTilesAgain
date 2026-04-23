/**
 * JSON report serializer.
 *
 * Wraps the ValidationReport with the pack code and serializes to a JSON string.
 */

import type { ValidationReport } from './ValidationReport';

export interface JsonReport {
  packCode: string;
  ok: boolean;
  counts: ValidationReport['counts'];
  issues: ValidationReport['issues'];
}

export function formatReportJson(packCode: string, report: ValidationReport): string {
  const json: JsonReport = {
    packCode,
    ok: report.ok,
    counts: report.counts,
    issues: report.issues,
  };
  return JSON.stringify(json, null, 2);
}
