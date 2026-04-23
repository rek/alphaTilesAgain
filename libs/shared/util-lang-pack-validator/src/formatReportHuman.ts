/**
 * Human-readable report formatter.
 *
 * Groups issues by severity (error → warning → info), then prints totals.
 * Designed for terminal output; no colors (keeps it simple and grep-friendly).
 */

import type { ValidationReport } from './ValidationReport';
import type { Issue, IssueSeverity } from './Issue';

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  error: 'ERRORS',
  warning: 'WARNINGS',
  info: 'INFO',
};

function formatIssue(issue: Issue): string {
  const parts: string[] = [];

  const loc: string[] = [];
  if (issue.file) loc.push(issue.file);
  if (issue.line !== undefined) loc.push(`line ${issue.line}`);
  if (issue.column) loc.push(`col ${issue.column}`);
  if (loc.length > 0) parts.push(`[${loc.join(', ')}]`);

  parts.push(`[${issue.code}]`);
  parts.push(issue.message);

  return '  ' + parts.join(' ');
}

export function formatReportHuman(packCode: string, report: ValidationReport): string {
  const lines: string[] = [];
  lines.push(`=== Validation report: ${packCode} ===`);

  const bySeverity: Record<IssueSeverity, Issue[]> = {
    error: [],
    warning: [],
    info: [],
  };

  for (const issue of report.issues) {
    bySeverity[issue.severity].push(issue);
  }

  for (const severity of ['error', 'warning', 'info'] as IssueSeverity[]) {
    const group = bySeverity[severity];
    if (group.length === 0) continue;

    lines.push('');
    lines.push(`--- ${SEVERITY_LABELS[severity]} (${group.length}) ---`);
    for (const issue of group) {
      lines.push(formatIssue(issue));
    }
  }

  lines.push('');
  const { error, warning, info } = report.counts;
  lines.push(
    `Totals: ${error} error(s), ${warning} warning(s), ${info} info(s) — ${report.ok ? 'OK' : 'FAILED'}`,
  );
  lines.push('');

  return lines.join('\n');
}
