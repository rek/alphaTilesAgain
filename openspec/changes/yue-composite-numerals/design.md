## Context

After `yue-numerals-game` + `fe1bcdc`, the `yue` pack ships the 13 base Cantonese numeral characters (`一二三四五六七八九十百千萬零`) with full tile + word + syllable triads and per-character audio. Issue #28 (Curtis-LeadM) asked for composite numerals — `二十`, `二百三`, `一百萬`, etc. — and asked whether each composite needs a single recording or can be assembled at runtime from existing per-character clips. Recommendation in the issue thread (after a self-correction): ship a smoke-test composite batch now using runtime syllable-by-syllable playback (pedagogically clearer than smoothed concat; silent gap = teaching cue), and let single recordings transparently swap in later.

Current audio surface (`libs/alphaTiles/data-audio`):
- `playWord(lwc)` looks up a handle in `handles.words` and plays it. If absent → warns once, returns.
- `playSyllable(char)` similar against `handles.syllables`.
- `getWordDuration(lwc)` returns the cached preload duration; `undefined` for missing.
- `data-audio` is forbidden from depending on `data-language-assets` (NX rule preserved by `AudioProvider`'s `loader` factory pattern).

Game-shell surface (`feature-game-shell/GameShellContainer`):
- Exposes `replayWord` to mechanics; default behavior: `audio.playWord(refWord.wordInLWC)`.
- `refWord` always carries `{ wordInLOP, wordInLWC }` — the LOP is available without re-querying.
- Mechanics can override via `setOnRepeat` for syllable-mode games (Italy S, yue-syllable-game).

Existing syllable parser:
- `parseWordIntoSyllables` lives in `libs/alphaTiles/feature-game-georgia/src/parseWordIntoSyllables.ts` — naive longest-prefix-match against the syllable list, returns `[]` if unparseable. Pure, no React deps.

## Goals / Non-Goals

**Goals:**
- Ship 5 composite numerals (`二十`, `三十`, `五十`, `一百萬`, `二百零三`) such that they appear in existing Thailand (doors 1–5) and Georgia T-mode (doors 10–11) rotations with audible feedback, without any new audio recordings.
- Audio fallback hooks at the *shell level*, not the audio-library level, so the engine boundary (`data-audio` ↛ `data-language-assets`) is preserved.
- The audio path stays a single line for the non-fallback case (`audio.playWord(id)`) — composites are an additive code path, not a refactor.
- Validator stays clean. Composite wordlist rows must NOT trigger `MISSING_WORD_AUDIO` errors; rely on the existing soft-fail (`audio/words/<lwc>.mp3` may be absent for some rows).
- Generated Arabic-digit images for all 5 composites via the existing `tools/build-numeral-images.ts` extension.

**Non-Goals:**
- New audio recordings (parked on Curtis's Lesson 28 batch).
- Glue-concat audio (rejected — different mechanism; produces unnatural prosody).
- New game classes or doors. Composites flow into existing rotations.
- Per-composite stroke data. Taiwan already decomposes compound tiles into individual hanzi (`buildTaiwanData.ts:30`); the existing per-char stroke JSON is sufficient.
- Container changes in `feature-game-thailand` / `feature-game-georgia`. The fallback hooks in `replayWord` so every consumer benefits without per-game edits.
- LWC-key migration. Composite LWCs use the same `zz_<digit>` convention as the base numerals (`zz_20`, `zz_1000000`, `zz_203`).

## Decisions

### D1: Syllable-chain fallback lives in `feature-game-shell`, not `data-audio`

**Decision:** Modify `GameShellContainer.replayWord` to detect missing word audio and play a syllable chain instead.

**Alternatives considered:**
- *Modify `data-audio.playWord` to fall back internally.* Rejected: `data-audio` would need access to the wordlist (LOP for each LWC) and the syllable map. That violates the NX rule (`data-audio` ↛ `data-language-assets`) which is currently preserved via the `loader` factory pattern. Adding the chain at the audio layer would also surprise non-game consumers (e.g. menu screens calling `playWord` for an instruction).
- *Per-game fallback in each container.* Rejected: duplicates the same five-line chain in Thailand, Georgia T-mode, Italy, etc. The whole point of `replayWord` is that it's one shared implementation.

**Why shell wins:** `feature-game-shell` already imports both `useAudio` and `useLangAssets`, has `refWord` in scope, and is the single chokepoint that every word-call game funnels through. Adding the fallback there is one diff, one test fixture, and zero new dependencies for `data-audio`.

### D2: Promote `parseWordIntoSyllables` to `libs/shared/util-phoneme`

**Decision:** Move `parseWordIntoSyllables` from `libs/alphaTiles/feature-game-georgia/src/` to `libs/shared/util-phoneme/src/` and re-export from the latter's index. Update Georgia's import to use the shared one.

**Rationale:** `feature-game-shell` cannot import from `feature-game-georgia` (sibling features). The function is pure, language-agnostic, and a natural neighbour of `parseWordIntoTiles` which already lives in `util-phoneme`. Promotion is a 2-line move + 1 new export.

**Alternative considered:** Duplicate the function inside `feature-game-shell`. Rejected — two copies drift; the function is short but pure and shared is the right home.

### D3: Audio chain uses the timer-ref pattern, not chained promises

**Decision:** When falling back, the shell schedules each next syllable via `setTimeout(getSyllableDuration(ch) ?? FALLBACK_MS + GAP_MS)`, stores the timer id in a `useRef`, and clears it on `startRound` + on container unmount.

**Rationale:** `audio.playSyllable(id)` resolves when playback *starts*, not when it ends. A naive `await audio.playSyllable(a); await audio.playSyllable(b)` would overlap (b starts before a finishes). The yue-syllable-game already uses this exact pattern for deferred audio (see `docs/GAME_PATTERNS.md` "Deferred audio after a clip: timer-ref, not chained promise"). Reuse, don't reinvent.

**Constants:**
- `GAP_MS = 150` — inter-syllable pause. Subjectively long enough to feel like distinct utterances, short enough to feel like a unit. Open for tuning during QA (Open Question O1).
- `FALLBACK_MS = 700` — duration used if `getSyllableDuration` returns `undefined`. Matches the observed mean of the base-numeral syllable clips (~400–940 ms).

### D4: `getWordDuration` for composites returns the chain total

**Decision:** Modify `getWordDuration(lwc)` in `useAudio` to return `sum(syllableDurations) + (n-1) * GAP_MS` when the per-word handle is absent but the LOP can be decomposed.

**Wait — D1 says `data-audio` doesn't know about the LOP.** Right. So this duration computation also moves to `feature-game-shell` as a derived getter exposed through the shell context. The shell holds a memoized `chainedDurations: Map<lwc, ms>` built at boot from the wordlist + syllable durations, and uses it in `replayWord`'s timer scheduling.

Callers of `audio.getWordDuration` directly (currently: none in game features — most use `getWordDuration` via the shell or for instruction sequencing) are unaffected.

### D5: Composite rows have no `audio/words/<lwc>.mp3` and the validator accepts that

**Decision:** Append the 5 composite rows to `aa_wordlist.txt` *without* creating per-word audio files. The lang-pack validator's `checkAudioReferences` already supports a soft-fail for missing word audio when `aa_settings.txt` `Has word audio: TRUE` — it emits a warning, not an error. Verified during the `fe1bcdc` validation: pack runs clean with 0 errors when many existing yue rows have no per-word audio.

**Verification:** Re-run validator after appending; expect 0 errors and 5 new `MISSING_WORD_AUDIO` *warnings* (not errors) — gated to keep the build green.

**Alternative considered:** Generate placeholder silent mp3s for the 5 composites. Rejected — silent files look like a bug to anyone inspecting the pack, and they pre-empt the slot where Curtis's real recording would land. Better to leave the slot legitimately empty.

### D6: Composite tiles are NOT added to `aa_gametiles.txt`

**Decision:** Only `aa_wordlist.txt` changes. No new tile rows.

**Why:** Tiles in this engine are single-character glyphs that the game decomposes / spells / traces. The Taiwan game already iterates `[...tile.base.trim()]` (`buildTaiwanData.ts:30`), so adding `二十` as a compound tile would just expose `二` and `十` to the writing game — and those are already exposed via the existing `zz_2` and `zz_10` tiles. Composites belong in the wordlist (where they describe a target word for spelling/listening games) and stay out of the tile pool.

### D7: Image generation matches the existing pattern

**Decision:** Extend the `NUMERALS` constant in `tools/build-numeral-images.ts` with `['zz_20', '20']`, `['zz_30', '30']`, `['zz_50', '50']`, `['zz_1000000', '1000000']`, `['zz_203', '203']`. The existing `fontPxForLabel` heuristic (length-based shrink) handles `'1000000'` (7 chars → 140px).

**Sanity check:** 7-character labels at 140px on a 512px canvas leave ~7px margin. If the result looks cramped, widen the canvas to 640px (mod the constant, not the function) — but verify visually before tuning.

## Risks / Trade-offs

- **[Risk] Syllable parser fails to fully decompose a composite.** → `parseWordIntoSyllables` returns `[]` if any prefix doesn't match. Mitigation: Smoke-test batch is hand-checked (every composite character is in `aa_syllables.txt`); add a startup assertion in `feature-game-shell` (or boot-time precompute) that every wordlist row either has a word-audio handle OR fully decomposes into known syllables. Validator-level check would be cleaner — propose as a follow-up but not blocking for this change.

- **[Risk] Chain audio sounds bad in practice.** → Subjective; needs QA before merge. Mitigation: ship behind a development assertion + manual QA the smoke-test batch on web + iOS + Android before archive. If unacceptable, the fallback can be gated on a settings-keyed flag and turned off (composites still appear visually in games; just no audio for the call).

- **[Risk] Timer leak on rapid round transitions.** → Same risk as Italy's auto-advance timer. Mitigation: clear the timer-ref at the top of `startRound` AND in the container unmount cleanup (the established pattern in GAME_PATTERNS.md).

- **[Trade-off] Composite words enter Georgia S-mode's distractor pool.** → Acceptable: each character in `二十` is already a known syllable; the composite as a *word* doesn't influence S-mode (which operates on syllable rows, not words). Verified by walking the Georgia container's pool construction — `setUpSyllables` reads `assets.syllables.rows`, not `assets.words.rows`.

- **[Trade-off] Validator warns on 5 composites for missing word audio.** → Acceptable warning noise; tests run clean. When Curtis records the batch, the warnings disappear automatically.

## Open Questions

- **O1: GAP_MS value.** 150ms is a starting guess. Manual QA after implementation should tune by ear; 100–250 ms is the plausible range.
- **O2: Validator follow-up — should `MISSING_WORD_AUDIO` be downgraded to info-level when the wordlist row's LOP fully decomposes into known syllables?** Probably yes, but not blocking. Open as a separate small change after this one archives.
- **O3: Should composites be excluded from random-word selection in games where the syllable chain is awkward (e.g. very long composites)?** The 5 smoke-test composites are 2–4 chars, all comfortable. Re-evaluate when the next batch ships (the formal three-digits with `零` may want a longer pause).
- **O4: `cantoneseDoors.generated.ts` / landing-page guide.** No new doors, so the generated file doesn't change. But should the existing door entries mention "composites included" in their descriptions? Probably yes — but that's a content edit and can ride on the apply phase rather than the design.
