/**
 * Player record — immutable identity + mutable play metadata.
 * UUID id decouples identity from slot/avatar; see design.md §D1.
 */
export type Player = {
  /** UUID v4, generated once at create time. Never changes. */
  id: string;
  /** 1–20 Unicode chars; validated on write, stored verbatim. */
  name: string;
  /** 0-based index into the pack's avatar list (max 11). */
  avatarIndex: number;
  /** Date.now() at creation. */
  createdAt: number;
  /** Date.now() at last selectPlayer call; null until first selection. */
  lastPlayedAt: number | null;
};
