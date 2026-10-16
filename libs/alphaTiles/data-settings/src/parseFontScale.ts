/**
 * Pack "Font Scale" (aa_settings.txt) → typography multiplier.
 * Absent / blank / non-numeric → 1.0 (today's sizes); clamped to [0.5, 2.5]
 * so a typo can't break layouts. See font-scaling-accessibility design.md §D1.
 */
const MIN_FONT_SCALE = 0.5;
const MAX_FONT_SCALE = 2.5;

export function parseFontScale(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return 1;
  const parsed = Number(raw.trim());
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(MIN_FONT_SCALE, Math.min(MAX_FONT_SCALE, parsed));
}
