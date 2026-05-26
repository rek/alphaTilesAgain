## Context

The Taiwan game (`libs/alphaTiles/feature-game-taiwan`) is a stroke-tracing writing-practice game built on `@jamsch/react-native-hanzi-writer`. For the `yue` (Cantonese) pack it cycles through every distinct hanzi present in `aa_gametiles.txt` for which stroke data exists (currently 150 chars), sorted ascending by stroke count (per `buildTaiwanData.ts:42-46`, issue #20).

After a player traces each character, the game plays audio. Today that audio comes from `taiwanData.audioForChar[char]`, a map built in `buildTaiwanData.ts:48-56` that — for every char — stores the LWC key of the **first compound word** in the wordlist containing that char. The code's own comment labels this a v1 fallback: *"character has no per-character audio in the yue pack; we play the audio of the first compound containing the char"*.

That comment is no longer accurate. The archived `2026-05-14-yue-syllable-game` change shipped 151 hand-cut single-syllable mp3s under `languages/yue/audio/syllables/`, registered through the manifest generator, and exposed via `audio.playSyllable(id)` in `useAudio.ts:96`. Taiwan was never re-wired to use them — it still uses the compound-word fallback, which means after writing `女` the learner hears the multi-syllable `zz_daughter.mp3` rather than `女` on its own.

Issue #27 from Curtis-LeadM supplies hand-recorded replacements for the **first 13 characters** in the stroke-count-sorted rotation — these are the characters every learner hits first regardless of CL. The initial bundle covered 12 chars (`人 士 女 丈 大 上 下 工 小 叉 公 夫`); after we flagged the gap at position 11, Curtis supplied `手` separately, noting the original recording was already single-syllable but uploading a fresh take anyway. The auto-`silencedetect`-cut clips for these 13 chars (from `tools/split-syllable-audio.ts`) are being replaced wholesale by Curtis's recordings. The other ~137 auto-cut clips stay as-is for now; they'll get the same syllable-first treatment automatically once the engine swap lands.

Curtis also clarified a pedagogical detail in his reply: the existing in-context recordings (`audioForChar` fallback path) may have been **cropped at record time** for words longer than two syllables — e.g. the `人` in `建築工人` may have been shortened by the recording artist for use as the wordlist entry, with the resulting clip not actually containing a clean `人` sound. This means the syllable-first swap is a correctness fix, not just a polish: today's behaviour can play audio that doesn't contain the target character at all.

### Required reading for implementers

- `docs/GAME_PATTERNS.md` — "Reusing a game class for a new pack feature", "Per-pack audio generation tooling", "Audio sequencing on correct"
- `openspec/changes/archive/2026-05-14-yue-syllable-game/{proposal,design,tasks}.md` — closest precedent (audio swap on the same pack)
- `openspec/changes/game-taiwan/specs/game-taiwan/spec.md` — the in-flight Taiwan spec; the "Character Audio On Completion" requirement is what this change supersedes in spirit
- `docs/ARCHITECTURE.md` §5 (pack shape), §8 (audio)
- `docs/CODE_STYLE.md` — no raw useEffect, container/presenter split
- `libs/alphaTiles/feature-game-taiwan/src/TaiwanInner.tsx` — both audio call sites (lines 80-83 and 97-99)
- `libs/alphaTiles/feature-game-taiwan/src/buildTaiwanData.ts` — the `audioForChar` precompute we're keeping as fallback
- `libs/alphaTiles/data-audio/src/lib/useAudio.ts` — `playSyllable` already implemented (lines 95-118) with the same silent-no-op-on-missing semantics as `playWord`

## Goals / Non-Goals

**Goals:**
- A learner who finishes tracing `女` in any Taiwan door hears `女` on its own, not `zz_daughter.mp3`.
- The 13 characters Curtis re-recorded play the customer-supplied hand recordings (not the existing auto-cut clips).
- The other ~137 yue characters automatically switch to single-syllable audio too (because they all have entries in `audio/syllables/`, just from the auto-cut splitter).
- No regression for any other language pack — packs without `audio/syllables/` continue to hear compound-word audio via the unchanged fallback path.
- Zero new tooling, zero new precompute keys, zero new files outside `languages/yue/audio/syllables/` and `libs/alphaTiles/feature-game-taiwan/src/`.

**Non-Goals:**
- Hand-recording the other 137 yue syllables — the customer hasn't supplied them and the auto-cut clips are usable.
- Switching Georgia, Thailand, or any other game's audio behaviour. Only Taiwan changes.
- Per-character audio for the `yue-numerals-game` characters. That change archived as `openspec/changes/archive/2026-05-25-yue-numerals-game/` and its assets are already live; numerals will automatically use the syllable-first path once this change merges.
- Replacing the audio behaviour spec in the in-flight `game-taiwan` change. We don't reach into another in-flight change.
- Generalising the syllable-first lookup to a precompute. It's a one-character key lookup; doing it inline in the container is fine.

## Decisions

### D1. Engine: container-side `pickAudioForChar` resolver

The two audio call sites in `TaiwanInner.tsx` route through one local helper that prefers syllable audio and falls back to compound-word audio:

```ts
function pickAudioForChar({ char, syllables, audioForChar }: {
  char: string;
  syllables: Record<string, number>;
  audioForChar: Record<string, string>;
}): { kind: 'syllable'; char: string } | { kind: 'word'; lwc: string } | { kind: 'none' } {
  if (syllables[char] !== undefined) return { kind: 'syllable', char };
  const lwc = audioForChar[char];
  if (lwc) return { kind: 'word', lwc };
  return { kind: 'none' };
}
```

Both call sites dispatch on the result. The discriminated-union shape is justified by the unit-test requirement (a pure helper testable without rendering the container — see D5) and keeps the fallback semantics legible.

**What `syllables[char]` actually means.** This is the *pack-shipped* predicate, not the *runtime-loaded* predicate. `assets.audio.syllables: Record<string, number>` is built by the manifest generator from `aa_syllables.txt` row keys (every row → require-id). It does NOT reflect whether the audio handle actually loaded at runtime. `useAudio.playSyllable(id)` handles the runtime-load-failure case identically to `playWord` — silent no-op with a `__DEV__` warning. So the resolver picks "syllable" whenever the pack shipped one, and runtime failures fall through to the same silent-no-op behaviour `playWord` already has for misloaded word audio. The two paths have symmetric edge cases; no regression.

**When is the fallback reachable?**
- **Yue today**: unreachable. The validator enforces full syllable coverage when `Has syllable audio: TRUE` (per `yue-syllable-game` ship invariant + `checkAudioReferences`), so every `currentChar` Taiwan rotates through has a syllable row. The fallback path is dead code on the yue build. That's fine — it's correct dead code.
- **Other packs**: reachable when `aa_settings.txt` has `Has syllable audio: FALSE` (or omits the row). In that case `assets.audio.syllables` is an empty object, so `syllables[char]` is undefined and the resolver routes to the compound fallback.

**Why keep the fallback at all?** Three reasons: (1) other packs may not enable syllable audio — the fallback is their only path; (2) the resolver should be pack-agnostic, not yue-specific; (3) deleting `audioForChar` from the precompute is a larger refactor (it's still emitted by `buildTaiwanData`) and out of scope for this change.

**Alternative considered**: add `hasSyllableHandle(id): boolean` to `useAudio` so the resolver checks the runtime-loaded predicate instead of the pack-shipped one. Rejected — adds public API surface for a corner case that's already handled silently by `playSyllable`'s existing no-op semantics. The asymmetry between "shipped but failed to load" (silent no-op) and "not shipped" (compound fallback) matches `playWord`'s existing behaviour and feels coherent.

### D2. Filename normalisation on copy

Curtis's bundle uses index-prefixed filenames with inconsistent whitespace; the late-arriving `手` file lives outside the bundle dir:

| Source path | Destination filename |
|---|---|
| `~/Downloads/fixed mp3-…/fixed mp3/01 人.mp3` | `人.mp3` |
| `~/Downloads/fixed mp3-…/fixed mp3/02 士.mp3` | `士.mp3` |
| `~/Downloads/fixed mp3-…/fixed mp3/03 女 .mp3` | `女.mp3` |
| `~/Downloads/fixed mp3-…/fixed mp3/04 丈.mp3` | `丈.mp3` |
| `~/Downloads/fixed mp3-…/fixed mp3/05 大.mp3` | `大.mp3` |
| `~/Downloads/fixed mp3-…/fixed mp3/06 上.mp3` | `上.mp3` |
| `~/Downloads/fixed mp3-…/fixed mp3/07 下.mp3` | `下.mp3` |
| `~/Downloads/fixed mp3-…/fixed mp3/08工 .mp3` | `工.mp3` |
| `~/Downloads/fixed mp3-…/fixed mp3/09 小.mp3` | `小.mp3` |
| `~/Downloads/fixed mp3-…/fixed mp3/10 叉.mp3` | `叉.mp3` |
| `~/Downloads/011 手.mp3` | `手.mp3` |
| `~/Downloads/fixed mp3-…/fixed mp3/12 公.mp3` | `公.mp3` |
| `~/Downloads/fixed mp3-…/fixed mp3/13 夫 .mp3` | `夫.mp3` |

Implementation is a one-shot `cp` per row, no script needed. All 13 destination files **already exist** under `languages/yue/audio/syllables/` (shipped by `yue-syllable-game`); the copy overwrites them. `git status` after the copies will show 13 modified binaries.

**Alternative considered**: write a tool (`tools/import-customer-syllable-audio.ts`) to automate the rename. Rejected for v1 — 13 files, one-time copy, would be deleted after use. If future customer audio drops arrive in the same format, the tool can be written then with multiple drop-shapes in mind.

### D3. `手` (position 11) resolved — Curtis supplied a fresh recording

Curtis's initial bundle had 01–10 then 12–13, skipping position 11 (`手`, 4 strokes). We flagged this on issue #27; his reply: *"easy one first, thanks for catching it, [011 手] was missing cos the original recording was already single syllable, and it is uploaded now"*. Source file: `~/Downloads/011 手.mp3` (10.2KB, md5 `7fc12fd8a3d70181c36c9b8a8f1383de` — distinct from the on-disk auto-cut clip, so it IS a fresh take rather than the original repackaged).

Scope is now 13 files instead of 12. No follow-up change needed; `手.mp3` ships in this PR alongside the other 12.

### D4. Storybook impact (TBD during apply)

`feature-game-taiwan/src/TaiwanScreen.stories.tsx` exists. If it provides a mock `useAudio` that only stubs `playWord`, the new `playSyllable` path will hit an unstubbed method and either throw or log. To verify during apply:

```bash
grep -rn 'playWord\|playSyllable\|useAudio' libs/alphaTiles/feature-game-taiwan/src/
```

If a mock needs updating, add `playSyllable: () => Promise.resolve()` alongside the existing `playWord` stub. The change is local to Taiwan's stories — no shared story plumbing needs touching.

### D5. Pure helper file + co-located test

Extract `pickAudioForChar` to `libs/alphaTiles/feature-game-taiwan/src/pickAudioForChar.ts` (one-function-per-file per `docs/CODE_STYLE.md`). Co-located test `pickAudioForChar.test.ts` covers all three branches:

1. `syllables[char]` defined → `{ kind: 'syllable', char }`.
2. `syllables[char]` undefined, `audioForChar[char]` defined → `{ kind: 'word', lwc }`.
3. Both undefined → `{ kind: 'none' }`.

Each branch maps 1:1 to a scenario in `specs/yue-writing-audio/spec.md`.

Container then dispatches:

```ts
const audioChoice = pickAudioForChar({
  char: currentChar,
  syllables: assets.audio.syllables,
  audioForChar: taiwanData.audioForChar,
});
if (audioChoice.kind === 'syllable') void audio.playSyllable(audioChoice.char);
else if (audioChoice.kind === 'word') void audio.playWord(audioChoice.lwc);
// kind === 'none' → no-op
```

**Alternative considered**: inline the 6-line if/else in the container without a separate file. Rejected — pure-helper extraction gives a unit test that runs without rendering the container, and the discriminated-union return type forces both call sites to handle all three branches consistently. Italy's `playCallAudio` (`ItalyContainer.tsx:185-187`) inlines the equivalent dispatch in a callback; that's also defensible but loses the unit test. Per `docs/ARCHITECTURE.md` §15, `type:feature` pure helpers are the place mandatory unit tests live, which makes extraction the higher-rigour option here.

### D6. Repeat button — confirmed: mirrors completion

Curtis confirmed on issue #27 (*"Repeat button - that's great, happy to see how it works"*) that the repeat button SHOULD play the same syllable audio as completion. Both `onRepeat` and `handleCharComplete` go through one `pickAudioForChar` dispatch — syllable-first, compound fallback, no audio if neither.

This was the provisional default before his reply; no behaviour change from the original plan. If a future teacher requests "word in context" on repeat for any pack, a per-pack setting (e.g. `aa_settings.txt` row `"Writing repeat plays compound"`) would scope it cleanly without touching this default.

**Note on the Italy precedent**: Italy's `useShellRepeat` plays the round's *reference* audio (the audio the player was just asked to identify) — that's pedagogically different from Taiwan, where the "reference" is the visible character and audio is feedback. So Italy isn't a clean precedent either way; the Cantonese teacher's intent is the deciding voice and that voice has answered.

### D7. Validator + manifest verification

After the asset swap:

1. `du -b languages/yue/audio/syllables/{人,士,女,丈,大,上,下,工,小,叉,手,公,夫}.mp3` — file sizes should match Curtis's source files, confirming the copy landed.
2. `APP_LANG=yue node_modules/.bin/tsx tools/validate-lang-pack.ts` — expected: 0 errors. The 13 files are existing rows in `aa_syllables.txt`; only the bytes change. `checkAudioReferences` still passes because the filename keys are unchanged.
3. `APP_LANG=yue npx tsx tools/generate-lang-manifest.ts` — expected: **counts unchanged from HEAD (163 syllables / 114 words / 116 tiles)**. The HEAD baseline reflects the now-archived numerals change (commits `78f2e53` etc.). The manifest doesn't checksum bytes for the syllable map; it records require ids keyed by character. Asset-byte changes don't trigger a manifest diff.

### D8. `game-taiwan` spec reconciliation

`openspec/changes/game-taiwan/specs/game-taiwan/spec.md` lines 97-109 currently say:

```
### Requirement: Character Audio On Completion

When a character is completed, the container SHALL play tile audio for
the character. If the pack has no per-character audio (because audio
is per-compound), the container SHALL fall back to playing the audio
of the first compound that contains this character.
```

Two issues with that requirement that this change exposes:

1. **It references a non-existent surface**: scenario at line 102 reads `assets.tileAudio["醫"]`. There is no `assets.tileAudio` on `LangAssets`. The real per-tile audio surface is `assets.audio.tiles: Record<string, number>`. The requirement was authored against a planned shape that never landed.
2. **The requirement specifies tile-audio-first, compound-fallback**. After this change ships, the actual code does syllable-first, compound-fallback. Tile-audio is never consulted for this game.

**Proposed reconciliation** (to apply when `game-taiwan` archives, not in this change):

Replace lines 97-109 of game-taiwan's spec with:

```
### Requirement: Character Audio On Completion

When a character is completed (or the repeat button is pressed),
the container SHALL play syllable audio for the character if the
pack ships it (`assets.audio.syllables[char]` defined). If the
pack does not ship syllable audio for that character, the container
SHALL fall back to playing the audio of the first compound word
in `aa_wordlist.txt` that contains the character. If neither
exists, the container SHALL play no audio.

#### Scenario: Syllable audio plays when available
- **GIVEN** the current character is `"女"` and the pack ships `audio/syllables/女.mp3`
- **WHEN** the character is completed OR the repeat button is pressed
- **THEN** `audio.playSyllable("女")` is invoked

#### Scenario: Compound audio fallback
- **GIVEN** the current character is `"醫"`, the pack ships no `audio/syllables/醫.mp3`, but `"醫生"` is a wordlist row with audio
- **WHEN** the character is completed OR the repeat button is pressed
- **THEN** `audio.playWord("doctor")` (the LWC key for 醫生) is invoked

#### Scenario: No audio when neither source exists
- **GIVEN** the current character has neither syllable audio nor compound coverage
- **WHEN** the character is completed OR the repeat button is pressed
- **THEN** the game plays no audio and does not throw
```

This change does NOT modify `game-taiwan`'s spec directly (OpenSpec MODIFIED deltas target `openspec/specs/`, not other in-flight changes). Whoever archives `game-taiwan` should apply this reconciliation before archival.

## Risks / Trade-offs

- **Risk:** Curtis's recordings have inconsistent volume / format vs the auto-cut clips, leading to volume cliff when the player crosses from a re-recorded char to an auto-cut one.
  → Mitigation: spot-check after copy. If volume mismatch is severe, run `ffmpeg -af loudnorm` over Curtis's 12 files before commit. Decision deferred to apply step — easy to add if needed, easy to skip if files sound consistent.
- **Risk:** A pack with `Has syllable audio: FALSE` but a corrupt empty entry in `assets.audio.syllables` would now play silence instead of the compound-word fallback.
  → Mitigation: `playSyllable` already handles `handle === null` (file failed to load) by silently no-op'ing and warning in `__DEV__`. We additionally check `assets.audio.syllables[char] !== undefined` before deciding to play syllable — so undefined keys correctly fall through to the compound branch. The "loaded-but-null" case is rare and the user-facing impact is one silent round, not a crash.
- **Risk:** ~~The in-flight `yue-numerals-game` and this change both touch the yue pack and Taiwan code/spec.~~ **Resolved**: `yue-numerals-game` archived as `2026-05-25-yue-numerals-game` before this change reaches apply. Its asset additions are live in `languages/yue/`; no file overlap with this change (numerals added new rows + new audio + new stroke JSON; this change overwrites 12 existing audio bytes + edits `TaiwanInner.tsx`). Numerals automatically benefit from the syllable-first path once this change merges.
- **Risk:** Future `game-taiwan` archival reconciliation.
  → When `openspec/changes/game-taiwan/` archives, its archived spec needs to reflect the syllable-first behaviour as the final state. Either: (a) update the game-taiwan change's spec before archive to match what's in the code, or (b) accept that the archived spec captures the originally-intended fallback behaviour and the syllable-first behaviour is documented only under `yue-writing-audio`. Apply step will flag this for the human to coordinate.
- **Trade-off:** Adding a 12-line pure helper + test for what's logically a 3-line useCallback.
  → Accepted — co-located test gives regression coverage for the resolver, the discriminated union makes the fallback semantics legible, and `docs/CODE_STYLE.md`'s one-function-per-file convention encourages exactly this shape.

## Migration Plan

Single PR. No staged rollout, no feature flag.

- Native builds: bundled at compile time. Existing `yue` build picks up new audio bytes on the next EAS build.
- OTA path: per `docs/decisions/ADR-009`, EAS Update channel `yue` ships the audio update without a binary rebuild. Run `eas update --branch yue` after merge.
- Rollback: revert the PR. Audio reverts to the auto-cut clips; engine reverts to compound-word. Both paths are bytewise compatible with previous releases.

## Open Questions

- ~~**Customer-side (issue #27)**: Should `手` (sort position 11) also be re-recorded?~~ **Resolved**: Curtis supplied `011 手.mp3` separately; scope grew to 13 files.
- ~~**Customer-side (issue #27)**: Should the repeat button stay syllable-first like completion?~~ **Resolved**: Curtis confirmed syllable-first on repeat — no behaviour split between completion and repeat.
- **Apply-time**: Do Curtis's 13 files have consistent loudness / format with each other and with the existing auto-cut clips? If not, run `ffmpeg loudnorm` before commit.
- **Apply-time**: Does the existing Taiwan storybook story mock `useAudio` in a way that breaks when `playSyllable` is called? If so, add a `playSyllable: () => Promise.resolve()` stub.
- **Coordination**: When `openspec/changes/game-taiwan/` archives, does its spec retain the original "compound-fallback" requirement or get updated to reflect syllable-first as the final state? Defer to whoever archives game-taiwan.
