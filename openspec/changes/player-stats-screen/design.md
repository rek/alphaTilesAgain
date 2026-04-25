## Context

No Java analog. Legacy Android tracked progress per-game but did not surface a per-player aggregate UI. This is a pure-new feature that sits on top of the already-implemented `data-progress` Zustand store.

`buildGameUniqueId` produces a key per `{ country, challengeLevel, playerId, syllableGame, stage }`. All aggregation hooks filter the store's entries by substring or by parsed key fields; existing `useTotalPoints` is the reference implementation.

### Required reading for implementers

- `AGENTS.md`
- `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §13 (routing)
- `docs/CODE_STYLE.md`
- `libs/alphaTiles/data-progress/src/lib/useProgressStore.ts` — `ProgressEntry`, `ProgressKey`, `useTotalPoints` reference
- `libs/alphaTiles/data-players/src/lib/usePlayersStore.ts` — `Player` shape
- `libs/alphaTiles/feature-choose-player/src/` — navigation entry point

## Goals / Non-Goals

**Goals:**
- Display total points, total trackers, last played, and per-game rows for one player.
- Add the two missing aggregation hooks to `data-progress` mirroring `useTotalPoints`.
- Container/presenter split with i18n-blind presenter.
- Wire the stats button from `feature-choose-player`.

**Non-Goals:**
- Editing or clearing stats.
- Visualizations beyond a list.
- Multi-player comparison.

## Decisions

### D1. State / data flow

`<PlayerStatsContainer>` reads `playerId` from `useLocalSearchParams()` (expo-router). It calls:

- `useTotalPoints(playerId)` → `number`
- `useTotalTrackers(playerId)` → `number`
- `useLastPlayed(playerId)` → `number` (epoch ms; `0` = never)
- `useProgressStore((s) => s.entries)` → filtered to entries whose key contains this `playerId`, mapped to per-game rows

Per-game row shape:

```ts
type PerGameRow = {
  key: string;             // full ProgressKey
  country: string;         // parsed from key
  challengeLevel: number;
  points: number;
  trackerCount: number;
};
```

Container builds the rows array, formats `lastPlayed` via `Intl.DateTimeFormat`, passes everything as props.

### D2. New hooks in `data-progress`

```ts
// useTotalTrackers.ts
export function useTotalTrackers(playerId: string): number {
  return useProgressStore((state) =>
    Object.entries(state.entries)
      .filter(([key]) => key.includes(playerId))
      .reduce((sum, [, entry]) => sum + entry.trackerCount, 0)
  );
}

// useLastPlayed.ts
export function useLastPlayed(playerId: string): number {
  return useProgressStore((state) =>
    Object.entries(state.entries)
      .filter(([key]) => key.includes(playerId))
      .reduce((max, [, entry]) => Math.max(max, entry.lastPlayed), 0)
  );
}
```

Both follow the existing `useTotalPoints` pattern: zustand selector that pure-derives over all entries. `playerId` is passed to the selector via closure.

Substring match on key is the existing convention; if false-positives across players become a concern later, switch to a parsed-key filter.

### D3. Presenter shape

```ts
type PlayerStatsScreenProps = {
  playerName: string;
  totalPoints: number;
  totalTrackers: number;
  lastPlayedLabel: string;     // formatted or "—"
  rows: PerGameRow[];
  rowLabels: { points: string; trackers: string };
  headerLabels: { totalPoints: string; totalTrackers: string; lastPlayed: string; perGame: string };
  onBack: () => void;
};
```

No hooks in presenter. All strings already translated.

### D4. Date formatting

Container computes:

```ts
const lastPlayedLabel = lastPlayed === 0
  ? '—'
  : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(lastPlayed));
```

`undefined` locale uses device default. The em-dash placeholder is also passed in pre-rendered.

### D5. Navigation entry

`feature-choose-player`'s player detail (the screen showing the active player's avatar/name) gains a Stats button. Tapping calls `router.push({ pathname: '/player-stats', params: { playerId } })`.

### D6. No new store

All data already lives in `useProgressStore` and `usePlayersStore`. Player name is fetched via `usePlayersStore` selector by id.

## Unresolved Questions

- If a player has zero entries, total points / trackers are 0, and "Last played" is "—" — show empty-state copy ("No games played yet") in addition to numeric zeros? Default: show zeros + dash, no separate empty state copy.
- Sorting per-game rows: by `lastPlayed` desc? Default yes.
