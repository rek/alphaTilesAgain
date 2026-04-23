/**
 * Typography scale — six semantic size keys, each with fontSize + lineHeight.
 * Values are pixel-density units (Expo handles PX→dp).
 * Keys match Tailwind naming for familiarity; values are fixed across packs.
 *
 * See design.md §D2.
 */
export const typography = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  md: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 20, lineHeight: 28 },
  xl: { fontSize: 28, lineHeight: 36 },
  '2xl': { fontSize: 40, lineHeight: 48 },
} as const;
