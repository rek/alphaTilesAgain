/** Placement bands of the "where to start" sheet: lowest step of each band. */
const BAND_START = { low: 0, mid: 2, high: 4 } as const;

/**
 * Turns a self-test score into a gentle next step: a result band (for the
 * encouragement line) and the menu step to start from — the band's first
 * step, moved to the nearest step the pack actually has doors in (first one
 * at or above it, else the highest). Mirrors the placement-guidance bands
 * (0–1 listen, 2–3 match, 4–6 build). Pure; nothing is stored (design D5).
 */
export function selfTestSuggestion({
  correct,
  total,
  tiers,
}: {
  correct: number;
  total: number;
  /** Steps (tiers) of the pack's enabled doors. */
  tiers: number[];
}) {
  const ratio = total > 0 ? correct / total : 0;
  const band: keyof typeof BAND_START = ratio >= 0.8 ? 'high' : ratio >= 0.5 ? 'mid' : 'low';
  const target = BAND_START[band];
  const sorted = [...new Set(tiers)].sort((a, b) => a - b);
  const step = sorted.find((n) => n >= target) ?? sorted[sorted.length - 1] ?? target;
  return { band, step };
}
