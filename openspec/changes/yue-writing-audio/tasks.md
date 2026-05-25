## 0. Preflight

- [ ] 0.1 Read `proposal.md`, `design.md`, and `specs/yue-writing-audio/spec.md` end-to-end.
- [ ] 0.2 Read `docs/GAME_PATTERNS.md` § "Reusing a game class for a new pack feature" and § "Audio sequencing on correct".
- [ ] 0.3 Read `openspec/changes/archive/2026-05-14-yue-syllable-game/{proposal,design,tasks}.md` — closest precedent for an audio-asset swap.
- [ ] 0.4 Read `libs/alphaTiles/feature-game-taiwan/src/TaiwanInner.tsx` (both audio call sites: `onRepeat` at line ~80-83, `handleCharComplete` audio block at line ~97-99) and `buildTaiwanData.ts` lines 48-56 (compound-fallback construction).
- [ ] 0.5 Read `libs/alphaTiles/data-audio/src/lib/useAudio.ts` lines 95-118 (`playSyllable` silent-no-op-on-missing semantics) and `libs/alphaTiles/data-language-pack/src/LangAssets.ts:53-62` (confirm `audio.syllables` is `Record<string, number>` — a pack-shipped predicate, not a runtime-loaded one).
- [ ] 0.6 Read `openspec/changes/game-taiwan/specs/game-taiwan/spec.md` lines 97-109 — the stale "Character Audio On Completion" requirement that this change supersedes (design § D8).
- [ ] 0.7 Confirm Curtis's reply on issue #27 — if `手` was intentionally omitted (keep auto-cut) or if he supplies a recording (add to scope) and whether the repeat button should mirror completion (provisional default) or stay compound (override).
- [ ] 0.8 If Curtis's answer changes scope (e.g. supplies `手`, or wants compound on repeat), update `proposal.md` / `design.md` § D6 / `specs/yue-writing-audio/spec.md` before continuing.

## 1. Asset Swap

- [ ] 1.1 Quick listening pass on Curtis's 12 files vs the existing auto-cut clips in `languages/yue/audio/syllables/` to confirm they're materially different and the customer recordings sound correct.
- [ ] 1.2 Loudness sanity check — sample 2-3 of Curtis's files and 2-3 existing auto-cut files; if there's a clear volume cliff, run `ffmpeg -af loudnorm` over Curtis's bundle before copying. Otherwise skip.
- [ ] 1.3 Copy Curtis's 12 mp3s into place with normalised filenames (per D2 mapping table in `design.md`). One `cp` per file; do not script for a one-shot.
- [ ] 1.4 Verify exactly 12 files in `git status --short languages/yue/audio/syllables/` show as modified — no new files, no deletions.
- [ ] 1.5 Confirm `languages/yue/audio/syllables/手.mp3` is unchanged from `HEAD`.

## 2. Engine: Pure Helper

- [ ] 2.1 Create `libs/alphaTiles/feature-game-taiwan/src/pickAudioForChar.ts` exporting `pickAudioForChar({ char, syllables, audioForChar })` returning the discriminated union `{ kind: 'syllable', char } | { kind: 'word', lwc } | { kind: 'none' }` per `design.md` § D1.
- [ ] 2.2 Create co-located `pickAudioForChar.test.ts` covering all three branches per `specs/yue-writing-audio/spec.md` § "Taiwan Plays Syllable Audio With Compound-Word Fallback". Each test case maps 1:1 to a spec scenario.
- [ ] 2.3 `nx test feature-game-taiwan` — confirm the new tests pass and nothing else regresses.

## 3. Engine: Container Wiring

- [ ] 3.1 In `TaiwanInner.tsx`, import `pickAudioForChar`.
- [ ] 3.2 Add a `playCharAudio` `useCallback` inside the `TaiwanGame` component that calls `pickAudioForChar` and dispatches to `audio.playSyllable` / `audio.playWord` / no-op. Deps: `[audio, assets.audio.syllables, currentChar, taiwanData.audioForChar]`.
- [ ] 3.3 Replace the body of the existing `onRepeat` callback (lines ~80-83) with `playCharAudio()`.
- [ ] 3.4 Replace the audio-play block inside `handleCharComplete` (lines ~97-99) with `playCharAudio()`.
- [ ] 3.5 Confirm `react-hooks/exhaustive-deps` passes with no `eslint-disable-next-line` comment needed.
- [ ] 3.6 Merge the two separate `react` imports at `TaiwanInner.tsx:8` and `:15` into one (`useCallback` is currently imported on its own line — cleanup while touching the region).
- [ ] 3.7 Confirm `buildTaiwanData.ts` is unchanged (the `audioForChar` precompute stays as the fallback path per D1).

## 4. Storybook + Mocks Audit

- [ ] 4.1 Open `libs/alphaTiles/feature-game-taiwan/src/TaiwanScreen.stories.tsx` — confirmed to exist. Check whether it mocks `useAudio` or renders the presenter directly without one.
- [ ] 4.2 If the story mocks `useAudio` and only stubs `playWord`, add `playSyllable: jest.fn().mockResolvedValue(undefined)` alongside. If the story doesn't render the container (only the presenter), no mock change needed.
- [ ] 4.3 Run `nx storybook storybook-host` and confirm the Taiwan story renders with the engine change in place. Note: per `docs/GAME_PATTERNS.md` § "Storybook host needs explicit lib registration", verify Taiwan is registered in `libs/shared/storybook-host/.storybook/main.ts` — if it isn't, flag the registration gap separately rather than fixing in this PR.

## 5. Manual QA (yue build)

- [ ] 5.1 `APP_LANG=yue` web build runs without TypeScript errors: `npx tsc --noEmit` (or `nx typecheck feature-game-taiwan` if scoped target exists).
- [ ] 5.2 `nx start-web-yue alphaTiles` — boot the yue build, navigate to Door 6 (Taiwan CL1).
- [ ] 5.3 Trace the first character (`人`); confirm the audio that plays is Curtis's `人.mp3` (not a compound word).
- [ ] 5.4 Press the repeat button on `人`; confirm the same audio plays (provisional default per D6 — may flip based on Curtis's reply).
- [ ] 5.5 Trace through positions 2-10 (`士 女 丈 大 上 下 工 小 叉`) confirming each plays the corresponding customer recording.
- [ ] 5.6 Trace position 11 (`手`); confirm it plays the existing (auto-cut) `手.mp3`.
- [ ] 5.7 Trace positions 12-13 (`公 夫`) confirming customer recordings.
- [ ] 5.8 Trace a character past position 13 (e.g. `心` at position 15) and confirm it plays the auto-cut syllable clip, not the compound — proves the engine swap applies pack-wide, not just to the 12 replaced files.
- [ ] 5.9 Repeat smoke on Door 7 (Taiwan CL2) and Door 8 (Taiwan CL3) — same characters, audio behaviour should be identical (CL only affects rendering, not audio source).
- [ ] 5.10 Verify Door 9 (Georgia S) still plays audio correctly — Georgia is unchanged, regression check.
- [ ] 5.11 Verify Doors 10-11 (Georgia CL2 / CL3 S — added by `yue-numerals-game`) still play audio correctly. Trace through a few numerals via the Taiwan rotation (`一`, `二`, etc.) — confirm syllable audio plays for numerals too.

## 6. Cross-Pack Regression

- [ ] 6.1 The `eng` pack has no Taiwan door in `aa_games.txt` (script type is Roman, not Chinese) — so there's no English Taiwan path to smoke. Skip cross-pack runtime QA; pack-agnostic correctness is covered by the unit-test on `pickAudioForChar` ("compound-word fallback plays when no syllable audio is shipped" scenario).
- [ ] 6.2 Optional sanity: `APP_LANG=eng tools/validate-lang-pack.ts` — expected: zero new errors / warnings introduced by this change.

## 7. Validator + Manifest

- [ ] 7.1 `APP_LANG=yue tools/validate-lang-pack.ts` — zero errors.
- [ ] 7.2 `APP_LANG=yue tools/generate-lang-manifest.ts` — expected: counts unchanged from HEAD baseline (**163 syllables / 114 words / 116 tiles** — post-`yue-numerals-game` state).
- [ ] 7.3 `git diff apps/alphaTiles/src/generated/langManifest.ts` — expected: empty diff (require-id strings unchanged; only the bytes behind the requires differ).

## 8. Quality Gates

- [ ] 8.1 `nx affected:lint` — zero violations.
- [ ] 8.2 `nx affected:test` — all green.
- [ ] 8.3 `npx tsc --noEmit` — zero errors.
- [ ] 8.4 `openspec validate --strict yue-writing-audio` — passes.
- [ ] 8.5 `nx graph` — confirm no new dependency violations introduced.

## 9. OTA + Commit Hygiene

- [ ] 9.1 Compose conventional-commits messages per `docs/COMMIT_CONVENTIONS.md` (≤50 chars subject, no capital first letter). Suggested split:
  - `chore(yue): re-record 12 syllable mp3s (#27)`
  - `feat(game-taiwan): syllable audio on completion (#27)`
  - `test(game-taiwan): cover pickAudioForChar branches`
- [ ] 9.2 Push branch, open PR linking issue #27 and the proposal folder. PR description SHOULD note that the repeat-button behaviour is provisional (D6) and may flip pending Curtis's reply.
- [ ] 9.3 After merge, plan OTA update: `eas update --branch yue --message "fix(audio): per-syllable audio in writing game"` (per `docs/decisions/ADR-009`).

## 10. Followups

- [ ] 10.1 If Curtis confirms `手` should be re-recorded, raise a tiny follow-up change adding the 13th file.
- [ ] 10.2 Open a coordinated edit / comment on `openspec/changes/game-taiwan/` notifying the owner that lines 97-109 of `specs/game-taiwan/spec.md` need the reconciliation in `design.md` § D8 before archive — including the `assets.tileAudio` → `assets.audio.syllables` surface-name fix.
- [ ] 10.3 Comment on issue #27 with the merge commit hash and OTA channel info so Curtis can confirm in-app.
