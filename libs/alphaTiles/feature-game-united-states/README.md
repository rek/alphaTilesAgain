# feature-game-united-states

Pairing/spelling game — port of `UnitedStates.java`.

## Mechanic

For each position in a target word, two tiles are shown (one correct, one distractor). The player selects one tile per position to reconstruct the word.

## Challenge Levels

| Level | Max word length |
|-------|----------------|
| 1     | 5 tiles        |
| 2     | 7 tiles        |
| 3     | 9 tiles        |

## Files

- `buildUnitedStatesData.ts` — precompute: buckets words by tile length at boot time
- `setupRound.ts` — selects a word and generates pairs with distractors
- `UnitedStatesContainer.tsx` — game logic, hooks, state
- `UnitedStatesScreen.tsx` — pure presenter
- `UnitedStatesScreen.stories.tsx` — Storybook stories

## Route

`apps/alphaTiles/app/games/united-states.tsx` — params: `gameNumber`, `challengeLevel`
