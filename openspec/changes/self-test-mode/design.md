# Design: self-test-mode (#42)

Ungraded self-check: a run of questions, the learner's own score at the end, nothing stored, nothing reported. Smallest sound build; progress tracking can be layered on later (`data-door-progress`, `player-stats-screen`) without redoing this.

## Decisions

**D1 — Question source: Thailand's 4-choice builder, driven by the pack's Thailand doors.**
`setupThailandRound` already builds a scorable single-answer question (prompt + 4 choices + `correctIndex`) for every ref/choice pairing (tile / word text / picture / audio / syllable). The self-test reuses it as-is; the *question types* are the challenge levels of the pack's enabled Thailand Doors (`doorsOf`), so the pack author already chose which pairings suit the language. yue (doors 1–5, 16–19): hear word → pick picture (165/265/365), hear sound → pick written word (234), hear word → pick written word (364), see written word → pick picture (145/245), see picture → pick written word (154/254). No new mechanic, no new pack column.
Rejected: Georgia / Peru / Ecuador builders (more mechanic-specific state, multi-tap or timed); mixing classes multiplies display code for no learner gain at this size.

**D2 — 10 questions per run.** Matches the issue mock ("8 / 10"); ~2 minutes. Question *i* uses source door *i mod n* in ladder order (yue: easy → hard distractors first, then the other pairings). Prompt items come from a random start offset (`roundIndex = start + i`) so runs differ; a prompt already used in the run is skipped (retry at `+ count`, bounded). Rounds the builder can't fill (`insufficient-content`) are dropped, so a thin pack gets a shorter run; zero buildable → `[]`.

**D3 — One attempt per question.** First tap is the answer (it's a check, not practice): correct choice turns green, a wrong pick red, matching chime, auto-advance after 1.2 s (timer ref, cleared on unmount). Audio prompts speak on show; tapping the prompt replays (pack speech, `usePackSpeech`).

**D4 — Ladder fit: the self-test is not a Door.** No `index`, no tier, no progress key; ladder order and the next-door search are untouched. It checks the Step 2 (match) skills — the one ladder step whose mechanic is a single-answer, scorable question — and is offered after the door grid, i.e. after the learner has seen the steps.

**D5 — Nothing stored, nothing reported.** Score = component state (`answers[]`), derived with `selfTestScore`. The lib never imports `data-progress`, `data-door-progress` or `util-analytics`; a test fails if it ever does. Leaving the screen discards the run.

**D6 — Entry point: menu footer button "Check yourself"** below the door grid → `router.push('/self-test')`. Shown only when `buildSelfTest` would have a source door (any enabled Thailand door). Top-bar / tabs avoided (tabs are chrome destinations; Settings/About are being changed elsewhere).

**D7 — End screen.** "End of test", "8 / 10", [Try again] (fresh run: remount via `key`), [Back to menu] (`router.back()`).

## Module shape

```
libs/alphaTiles/feature-self-test/src/
  index.ts                 # SelfTestContainer, buildSelfTest, selfTestScore
  buildSelfTest.ts         # ({ doors, tiles, words, syllables, count?, rng? }) → SelfTestQuestion[]
  selfTestScore.ts         # ({ questions, answers }) → { correct, total }
  SelfTestContainer.tsx    # hooks: useLadderDoors, useLangAssets, usePackSpeech, useAudio, router, t
  SelfTestScreen.tsx       # presenter: header (back + "Question 3 of 10"), ThailandScreen body, end card
  __tests__/buildSelfTest.test.ts   # real yue pack
  __tests__/noProgressWrites.test.ts
```

`SelfTestQuestion = { doorIndex, choiceType, round: ThailandRound }`.

Thailand lib: extract `buildRefDisplay` / choice-display mapping from `ThailandContainer` into `thailandRoundView({ round, choiceType, wordImages, refColor })` → `{ refDisplay, choices, choiceLabels }`; container uses it unchanged in behaviour. Add `thailandQuestion({ challengeLevel, tiles, words, syllables, roundIndex, rng })` → `{ choiceType, round }` (decode + `setupThailandRound` in one call). Export it, `thailandRoundView` and `ThailandScreen` from the lib root. Node tests map the lib to `thailandQuestion.ts` (the root pulls the RN container). `feature → feature` import is allowed by the boundary rules (games already import `feature-game-shell`).

## i18n

`chrome.menu.self_test` ("Check yourself"), `chrome.menu.a11y.self_test`, `chrome.selfTest.{title, progress, end_title, score, try_again, back_to_menu, empty}`, `chrome.selfTest.a11y.{play_prompt, picture_prompt}`. en + zh-HK; zh-HK rows added to the review sheet.

## Unresolved

- Teacher-facing / stored results: out of scope by decision (issue #42).
- Other mechanics as question sources once a pack has no Thailand door.
