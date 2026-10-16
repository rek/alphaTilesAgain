/**
 * Typography scale — six semantic size keys, each with fontSize + lineHeight.
 * Values are pixel-density units (Expo handles PX→dp).
 * Keys match Tailwind naming for familiarity.
 *
 * The ladder is fixed; a pack's "Font Scale" (aa_settings.txt) multiplies
 * every slot proportionally. See font-scaling-accessibility design.md §D2.
 */
const BASE = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  md: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 20, lineHeight: 28 },
  xl: { fontSize: 28, lineHeight: 36 },
  '2xl': { fontSize: 40, lineHeight: 48 },
} as const;

export type TypographySlot = keyof typeof BASE;
export type Typography = Record<
  TypographySlot,
  { fontSize: number; lineHeight: number }
>;

export function buildTypography(fontScale: number): Typography {
  const scaled = {} as Typography;
  for (const slot of Object.keys(BASE) as TypographySlot[]) {
    scaled[slot] = {
      fontSize: BASE[slot].fontSize * fontScale,
      lineHeight: BASE[slot].lineHeight * fontScale,
    };
  }
  return scaled;
}
