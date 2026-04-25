## Why

Java HUD comparison revealed two fidelity gaps in the game shell: tracker icons are hidden from screen readers (opposite of Java behavior), and bottom chrome buttons use text labels instead of the icon drawables Java ships. These affect both accessibility and visual correctness for the literacy-game audience.

Note: challenge-level normalization (`displayChallengeLevel`) was also flagged during review but is already specced in `scoring/spec.md` and fully implemented in `util-scoring` + `GameShellContainer`. Not re-specced here.

## What Changes

- **Tracker icons expose accessibility labels** — each of the 12 tracker dots gains `accessibilityLabel="Tracker N of 12"` and `accessible={true}`, matching Java's `contentDescription="@string/trackerNof12"` strings. Currently they are hidden (`accessibilityElementsHidden`).
- **Bottom chrome buttons use icon images** — back, instructions, and advance/replay buttons replace text labels with the Java drawables (`zz_games_home`, `zz_instructions`, `zz_forward`, `zz_forward_inactive`). `GameShellScreen` renders `<Image>` instead of `<Text>` inside each `<Pressable>`. The existing text-label props become accessibility labels only.

## Capabilities

### New Capabilities

- `game-shell-tracker-accessibility`: ScoreBar tracker dots expose individual accessibility labels matching Java strings.
- `game-shell-chrome-icons`: GameShellScreen bottom chrome buttons render icon images from the drawable set, not text labels.

### Modified Capabilities

- `score-display-verification`: No requirement changes — implementation only.

## Impact

- `libs/shared/ui-score-bar` — `ScoreBar.tsx` tracker rendering
- `libs/alphaTiles/feature-game-shell` — `GameShellScreen.tsx` chrome button rendering
- `apps/alphaTiles` — must supply icon asset requires (Metro static `require`) alongside existing `celebrationSource` pattern
- No API changes, no data-access changes, no i18n key changes (labels move to `accessibilityLabel` props)
