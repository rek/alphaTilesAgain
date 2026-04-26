/**
 * Pagination math for Colombia's tile keyboard.
 *
 * Java reference: Colombia.java loadKeyboard()/onBtnClick()/updateKeyboard().
 * Java uses literal `33` (NOT `tilesPerPage - 2`) for keyIndex math even though
 * tilesPerPage = 35 — preserve this quirk.
 *
 * - totalScreens = ceil(keysInUse / 33)
 * - partial      = keysInUse % 33   (0 means last page is full)
 * - keyIndex     = 33 * (page - 1) + slotIndex   (page 1-based)
 */

export const TILES_PER_PAGE = 35;
export const SYLS_PER_PAGE = 18;
/** Java literal: keys per screen body = 33 (35 slots minus 2 nav arrows). */
export const KEYS_PER_PAGE_BODY = 33;

export type PaginationInfo = {
  /** True iff the keyboard exceeds a single page (T-CL3/CL4 with keysInUse > 35). */
  paginated: boolean;
  totalScreens: number;
  /** Number of visible body slots on the LAST page; 0 means last page is full. */
  partial: number;
};

export function paginateKeyboard(keysInUse: number, paginated: boolean): PaginationInfo {
  if (!paginated) {
    return { paginated: false, totalScreens: 1, partial: 0 };
  }
  const partial = keysInUse % KEYS_PER_PAGE_BODY;
  let totalScreens = Math.floor(keysInUse / KEYS_PER_PAGE_BODY);
  if (partial !== 0) totalScreens++;
  return { paginated: true, totalScreens, partial };
}

/** Compute absolute index into the keyboard for a tap at body slotIndex on `page`. */
export function computeKeyIndex(page: number, slotIndex: number): number {
  return KEYS_PER_PAGE_BODY * (page - 1) + slotIndex;
}

/** Number of visible body slots on the given page. */
export function visibleSlotsOnPage({
  page,
  totalScreens,
  partial,
}: {
  page: number;
  totalScreens: number;
  partial: number;
}): number {
  if (totalScreens === 1) return 0;
  if (page === totalScreens && partial !== 0) return partial;
  return KEYS_PER_PAGE_BODY;
}
