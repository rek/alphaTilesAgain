## Context

This change extends the `yue` (Cantonese) language pack with 12 Chinese-numeral characters (`一二三 五六七八九 十百千萬`) and ships two new menu doors. It's a direct response to issue [#28](https://github.com/rek/alphaTilesAgain/issues/28) from the language community. The patterns are well-trodden: `2026-05-14-yue-syllable-game` proved that "a new game for the player can be a new `aa_games.txt` door on an existing class plus the pack data it needs — no new `feature-game-*` lib" (per `docs/GAME_PATTERNS.md` § "Reusing a game class for a new pack feature"). This change is even thinner than yue-syllable-game — that one needed a per-char audio splitter and a one-line container tweak; this one is **pure pack data** plus two door rows.

### Required reading for implementers

- `docs/GAME_PATTERNS.md` — "Reusing a game class for a new pack feature", "Per-pack audio generation tooling"
- `openspec/changes/archive/2026-05-14-yue-syllable-game/{proposal,design,tasks}.md` — closest precedent
- `docs/ARCHITECTURE.md` §5 (pack shape), §8 (audio), §17 (game taxonomy)
- `docs/CODE_STYLE.md` (one function per file)
- `languages/yue/` — every file in this directory (we're appending to most of them)
- `tools/build-stroke-data.ts` — the Chinese-script stroke pipeline; fetches per-character JSON from `cdn.jsdelivr.net/npm/hanzi-writer-data@2.0` and writes to `languages/yue/strokes/<char>.json`
- `tools/generate-cantonese-doors.ts` — regenerates `apps/home/src/app/cantoneseDoors.generated.ts` after any `aa_games.txt` edit
- `apps/home/src/app/cantoneseGuide.tsx` — landing-page door descriptions; needs a hand-authored entry per new door key (`<class>-<CL>-<S|T>`)
- `libs/alphaTiles/feature-game-taiwan/src/buildTaiwanData.ts` — confirms Taiwan auto-orders by stroke count and ignores `StagesIncluded`
- `libs/alphaTiles/feature-game-georgia/src/GeorgiaContainer.tsx` — confirms Georgia picks from all words, no stage filter
- `libs/shared/util-lang-pack-validator/src/checks/checkImageReferences.ts` — every wordlist row needs `images/words/<lwc>.png`
- `libs/shared/util-lang-pack-validator/src/checks/checkAudioReferences.ts` — with `Has syllable audio: TRUE`, every syllable row needs `audio/syllables/<name>.mp3`

## Goals / Non-Goals

**Goals:**
- 12 Cantonese numerals are learnable through the existing Taiwan (writing) and Georgia (listening) games, with audio that matches the customer's recordings.
- Two new menu doors appear so the customer sees a "new batch" as requested.
- All pack-data additions pass the existing validator with no new check needed.
- No engine code is touched; this is reproducible as a pure asset PR.
- The landing-page Cantonese guide stays in sync with the new doors via the generated-doors tool.

**Non-Goals:**
- Adding the `四` (4) tile/audio/stroke — deferred until customer supplies the audio recording.
- Shipping composite numerals (`二十`, `二百三`…) as words — deferred to a follow-up change once we have audio and the customer-confirmed transcription convention.
- Integrating the anomalous `10 thousand.mp3` — deferred until the customer clarifies what it actually contains.
- Building a numerals-only door that excludes the existing 80-word vocabulary — requires adding stage-filter support to `buildTaiwanData` and `pickGeorgiaWord`, which is genuinely out of scope ("zero engine changes" is the design boundary). A follow-up `stages-filter` change can add this when prioritised.
- Generalising any of this tooling beyond `yue`.

## Decisions

### D1. Reuse Taiwan + Georgia; no new feature lib

Per `docs/GAME_PATTERNS.md` § "Reusing a game class for a new pack feature", a new pack feature should never spawn a new `feature-game-*` lib if an existing class already implements the mechanic. Taiwan = HanziWriter stroke-tracing (matches the customer's "writing game" ask). Georgia S-mode = 6/12/18-choice listen-and-tap on isolated syllables (matches the customer's "hear them in isolation" subtext). Both are already wired for `yue`.

**Alternative considered**: a dedicated `feature-game-numerals` lib that scopes Taiwan-like writing to the numeral pool. Rejected — adds engine code, breaks the pattern of cheap pack-data extensions, and the deeper limitation (stage filtering) is shared with all other future "subset" games. Solving it in a follow-up `stages-filter` change buys far more leverage.

### D2. Use the existing dual tile + word listing pattern for one-character entries

The current `yue` pack already lists 12 single-character entries (`仔`, `女`, `魚`, `蝦`…) as **both** an `aa_gametiles.txt` row **and** an `aa_wordlist.txt` row with the same English LWC. The tile row drives Taiwan (HanziWriter pulls strokes by tile.base char); the word row drives Georgia (`pickGeorgiaSyllableWord` picks from word rows). Mirror exactly:

| Asset file | What gets appended | Required by |
|---|---|---|
| `aa_gametiles.txt` | 12 rows: `<char> <numeral distractors> X zz_<digit> <char> none X none X 0 0 0 1 - -` | Taiwan tile pool |
| `aa_wordlist.txt` | 12 rows: `zz_<digit> <char> 0 - 0 -` | Georgia word picker, validator image check |
| `aa_syllables.txt` | 12 rows: `<char> <empty distractors> <char> <ms> <color>` | Georgia S-mode syllable list |
| `audio/syllables/<char>.mp3` | 12 files | `playSyllable` lookups; validator `Has syllable audio: TRUE` |
| `audio/words/zz_<digit>.mp3` | 12 files (same source as syllables) | `playWord` lookups (Georgia reference word audio) |
| `audio/tiles/zz_<digit>.mp3` | 12 files (same source) | Validator `Has tile audio: TRUE` requires audio/tiles/<AudioName>.mp3 for every tile row (**added during implementation — original D2 table missed this; caught by `checkAudioReferences` MISSING_TILE_AUDIO error**) |
| `images/words/zz_<digit>.png` | 12 files | Validator `checkImageReferences` (every word LWC needs an image) |
| `strokes/<char>.json` | 12 files | Taiwan HanziWriter loader (`assets.strokes[char]`) |

**English LWC choice**: `zz_<digit>` — `zz_1`, `zz_2`, …, `zz_10`, `zz_100`, `zz_1000`, `zz_10000`. The `zz_` prefix matches the existing pack convention for community-supplied asset names that don't have natural English single-word equivalents. The digit form is unambiguous, sortable, and what the Arabic-digit placeholder image renders.

**Tab structure for `aa_gametiles.txt`**: 19 columns matching the existing header. All distractor columns get duplicate copies of the base character (mirroring how existing rows have semi-random distractors — the validator only checks shape; distractor *quality* is best-effort). Type=`X` matches every existing yue tile. `Placeholder`/`Placeholder`/`Placeholder` all zero. `FirstAppearsInStage`=`1` (we tag stage 1 since stage filtering isn't enforced; the column is informational only for these games today).

### D3. Audio file renaming, not re-encoding

The 12 source mp3s under `/home/adam/Downloads/Numerals-…/Numerals/` are correctly encoded mp3 already (matches the existing `yue` pack's mp3 format). Treat them as drop-in: simple `cp` with the destination filename. Names map:

| Source | → `audio/syllables/` | → `audio/words/` | → `audio/tiles/` |
|---|---|---|---|
| `001 一.mp3` | `一.mp3` | `zz_1.mp3` | `zz_1.mp3` |
| `002 二.mp3` | `二.mp3` | `zz_2.mp3` | `zz_2.mp3` |
| `003 三.mp3` | `三.mp3` | `zz_3.mp3` | `zz_3.mp3` |
| `005 五.mp3` | `五.mp3` | `zz_5.mp3` | `zz_5.mp3` |
| `006 六.mp3` | `六.mp3` | `zz_6.mp3` | `zz_6.mp3` |
| `007 七.mp3` | `七.mp3` | `zz_7.mp3` | `zz_7.mp3` |
| `008 八.mp3` | `八.mp3` | `zz_8.mp3` | `zz_8.mp3` |
| `009 九.mp3` | `九.mp3` | `zz_9.mp3` | `zz_9.mp3` |
| `010 十.mp3` | `十.mp3` | `zz_10.mp3` | `zz_10.mp3` |
| `0100 百.mp3` | `百.mp3` | `zz_100.mp3` | `zz_100.mp3` |
| `01000 千.mp3` | `千.mp3` | `zz_1000.mp3` | `zz_1000.mp3` |
| `010000 萬.mp3` | `萬.mp3` | `zz_10000.mp3` | `zz_10000.mp3` |

The same byte content lands under `audio/syllables/<char>.mp3`, `audio/words/zz_<digit>.mp3`, and `audio/tiles/zz_<digit>.mp3`. This intentionally duplicates the file (a few KB each, negligible) rather than symlinking — `cp` keeps the manifest generator's per-file checksum logic simple and matches the yue-syllable-game tier-1 pattern (one-character word recording = syllable recording = tile recording, copied verbatim). The `audio/tiles/` copy was added during implementation when `checkAudioReferences` flagged `MISSING_TILE_AUDIO` errors for every new tile row — the original D2 table omitted it.

**Alternative considered**: a script that copies + transcodes. Rejected — the source format is already correct, transcoding risks introducing artefacts, and a one-shot manual copy is the lowest-risk path.

The 13th source file `10 thousand.mp3` is **not** copied — it's out of scope and the customer will be asked to clarify.

### D4. Stroke data via the existing `build-stroke-data.ts` pipeline

`tools/build-stroke-data.ts` already exists, is gated on `Script type === Chinese` (yue matches), reads tile chars from `aa_gametiles.txt`, fetches per-character JSON from the MMH dataset on jsdelivr CDN (`hanzi-writer-data@2.0`), caches under `tools/data/stroke-cache/<char>.json`, and writes `languages/yue/strokes/<char>.json`. The 12 numerals are all common CJK Unified Ideographs (U+4E00 range) — MMH covers them with no special handling.

The flow:

1. Append the 12 numeral tile rows to `aa_gametiles.txt` (D2).
2. Run `APP_LANG=yue npx tsx tools/build-stroke-data.ts`.
3. Verify 12 new files under `languages/yue/strokes/` and confirm console output shows `covered+=12, missing=0`.
4. Commit the new JSON files alongside the pack-data edits.

**No new tooling needed for strokes.** The existing pipeline does all the work.

### D5. Reference-image generation — new throwaway tool

The validator requires `images/words/<lwc>.png` for every wordlist row. For the 12 new numerals we need 12 PNGs. The existing yue pack uses hand-drawn vocabulary images (e.g. a stethoscope for `zz_doctor`); we can't realistically photograph "1" or "10000". The right call: **render the Arabic digit on a plain background** so the image conveys "this is the number five" even before the learner knows the character.

Implementation: `tools/build-numeral-images.ts` (sibling convention with `build-stroke-data*.ts`):

```ts
// Pseudo-shape
import { createCanvas } from 'canvas';        // already a dev dep
const SIZE = 512;                              // matches existing yue word PNG ~scale
const FG = '#1565C0';                          // first themeBlue from aa_colors.txt
const BG = '#FFFFFF';
const FONT = 'bold 320px sans-serif';
const NUMERALS = [
  ['zz_1',     '1'],
  ['zz_2',     '2'],
  // ...
  ['zz_10000', '10000'],
];
for (const [lwc, digits] of NUMERALS) {
  const c = createCanvas(SIZE, SIZE);
  // fill BG, set FONT, centre-render digits, write PNG to languages/yue/images/words/<lwc>.png
}
```

CLI: `npx tsx tools/build-numeral-images.ts`. No flags, no caching, no network. Idempotent (overwrites every run). Output is **committed** — the tool ships as documentation of how the PNGs were produced, not as a runtime dependency. The 12 PNGs are < 5 KB each.

**Alternatives considered**:
- Render the Chinese character (`五`) instead of the Arabic digit (`5`). Rejected — Georgia already displays the character as the reference label; the image's job is to provide a *second*, language-neutral cue.
- Skip the image entirely by adding numerals to `aa_wordlist.txt` without word images and disabling `checkImageReferences` for those rows. Rejected — silently weakening a validator check is worse than a 30-line one-off tool.
- Hand-design 12 PNGs (clipart digits, decorative borders). Rejected for v1 — the tool gives the community a baseline they can swap out later for hand-art if desired.

### D6. Door additions — Georgia CL2 S and CL3 S

Append two rows to `languages/yue/aa_games.txt` (after the current 9 rows):

```
10  Georgia  2  2  X  0  S  -
11  Georgia  3  3  X  0  S  -
```

Decoded per Georgia's `countForLevel` (see `feature-game-georgia/src/countForLevel.ts`):
- Door 10: `level % 3 === 2` → 12 choices. CL2 is the random-pool fill (not hard band), so distractor columns are unread.
- Door 11: `level % 3 === 0` → 18 choices. CL3 random-pool, ~half the syllable pool visible at once.

**Color column**: cycles through `aa_colors.txt` indices to give the menu tiles visual distinction (`2` and `3` haven't been used yet by existing doors). **InstructionAudio** = `X` (no per-door instruction clip — matches Door 9). **AudioDuration** = `0` (instruction is `X`). **SyllOrTile** = `S` — both doors are syllable-mode. **StagesIncluded** = `-` (not enforced by Georgia today; using `-` matches existing rows).

**No Taiwan door added**. Taiwan's `buildTaiwanData` already sorts its character pool by stroke count ascending (`buildTaiwanData.ts:43-46`). Adding the 12 numerals to `aa_gametiles.txt` automatically prepends them to the front of the rotation for **every** Taiwan door — `一` (1 stroke) → `二 七 八 九 十` (2) → `三 千` (3) → … → existing yue characters (heaviest). The customer's "new batch of writing games" is already satisfied by the **existing** Taiwan doors 6/7/8 once numerals enter the pool; adding more Taiwan CL doors would just duplicate the same character pool at different difficulty knobs and Taiwan doesn't decode CL > 3 (`TaiwanInner.tsx:32-36` falls back to CL1 for unknown levels — adding e.g. CL4 would produce a CL1 clone).

**Why not also add Georgia CL1 T mode?** Tile-mode Georgia (T) filters words to those whose first tile passes the CorV (consonant-or-vowel) filter — and yue tiles all have `Type=X`. The yue-syllable-game design (D7) discusses this; T-mode runs on yue but every word fails the filter so the screen shows `?` (the actual bug fix in that change preserved S-mode while leaving T broken — fixing T-mode for `Type=X` packs is a separate, larger change).

### D7. Landing-page guide stays in sync

The landing-page (`apps/home`) Cantonese guide reads from `cantoneseDoors.generated.ts` (regenerated from `aa_games.txt`) and joins each row to a hand-authored description in `cantoneseGuide.tsx`'s `DOOR_CONTENT` map. After adding the two new doors:

1. Run `bun tools/generate-cantonese-doors.ts` (or `npx tsx`). It re-emits `cantoneseDoors.generated.ts` with the 11-row list.
2. Add two entries to `DOOR_CONTENT` in `cantoneseGuide.tsx`:
   - Key `'georgia-2-S'` — title "First-syllable identification — 12 choices", difficulty "Medium-Hard", same mechanic copy as Door 9 with an honest note that the choice grid doubles.
   - Key `'georgia-3-S'` — title "First-syllable identification — 18 choices", difficulty "Hard", same mechanic copy with the 18-choice note.

If we skip step 2 the page still renders — there's a fallback for unrecognised keys — but the guide will visibly say "missing description" for the new doors. The Cantonese-language community / customer-facing nature of this surface means we should ship complete descriptions.

### D8. Validator + manifest verification

After all pack edits + tool runs:

1. `APP_LANG=yue node_modules/.bin/tsx tools/validate-lang-pack.ts` — expected: 0 errors.
   - `checkAudioReferences`: 12 new syllable audio + 12 new word audio files all resolve.
   - `checkImageReferences`: 12 new word images all resolve.
   - `checkSyllablesCoherence`: still emits `SYLLABLES_SKIPPED` info (no `.` markers added).
   - `checkTilesCoherence` (or analog): 12 new tile rows are well-formed.
2. `APP_LANG=yue npx tsx tools/generate-lang-manifest.ts` — expected: manifest counts increase to 163 syllables, 114 words, 92 tiles (current 151+102+80 + 12 each).
3. `APP_LANG=yue nx start-web-yue alphaTiles` (or local web export) — Door 10 + Door 11 visible in the menu; tapping Door 10 launches Georgia with 12 visible choices; tapping a Taiwan door starts with `一`.

### D9. `四` is genuinely missing — ship with the gap

The customer-supplied folder has audio for 1, 2, 3, **(gap)**, 5, 6, 7, 8, 9, 10, 100, 1000, 10000. `四` is in the Lesson 27 spreadsheet but no `004 四.mp3` was provided. Options considered:

| Option | Verdict |
|---|---|
| Block the entire change until customer supplies `四` audio | Rejected — delays everything else for a single missing file. |
| Use TTS to generate a placeholder `四` clip | Rejected — voice mismatch with the rest of the recordings would sound jarring and could embed a wrong tone. |
| Use a different speaker's recording from a public dataset | Rejected — license risk + voice mismatch. |
| **Ship without `四`** (this change), add `四` in a follow-up | **Selected.** Pedagogically awkward (1–3, _, 5–10) but unblocks shipping. Follow-up is trivially small once the audio arrives — 1 tile + 1 word + 1 syllable + 1 audio × 2 + 1 PNG + 1 stroke run. |

The proposal commits to posting an issue-#28 comment listing this and the `10 thousand.mp3` mystery as customer follow-ups.

## Risks / Trade-offs

- **Risk:** New tile rows pollute existing doors' audio/visual mix.
  → Mitigation: numerals' stroke counts (1-12) overlap with existing yue characters (1-19), and the pre-sort makes `一` the absolute first character in the Taiwan rotation. Pedagogically aligned, not regression.
- **Risk:** Georgia CL1 S Door 9 now has 12 more potential syllables in its pool.
  → Mitigation: 6-choice random pool still works identically; just sampling from a 163-entry pool instead of 151. No correctness impact.
- **Risk:** Placeholder PNGs look unprofessional next to hand-drawn vocabulary images.
  → Mitigation: digit-on-plain-background is visually consistent within the numeral set; tool is committed so community can swap images later without code changes.
- **Risk:** MMH dataset is missing one of the 12 numerals.
  → Mitigation: spot-checked — `一`, `二`, `三`, `五`, `六`, `七`, `八`, `九`, `十`, `百`, `千`, `萬` are all common CJK Unified Ideographs; MMH has full coverage of the U+4E00 range. Tool warns + skips on missing chars without crashing; if any do miss, the tool's `missing` list surfaces them.
- **Trade-off:** No stage-filter means a true "numerals only" drill isn't possible.
  → Accepted for v1; follow-up `stages-filter` change unblocks it for *every* game class at once.
- **Trade-off:** Duplicating audio files between `audio/syllables/` and `audio/words/` slightly inflates the bundle (~60 KB total).
  → Accepted — keeps the manifest generator + audio preloader simple; matches the yue-syllable-game tier-1 pattern.

## Open Questions

- ~~Whether numerals are stage-isolatable in v1.~~ **Resolved (No)**: shipped without isolation; numerals enter the shared pool for Taiwan + Georgia. Follow-up `stages-filter` change tracked separately.
- ~~Whether to ship 12 or 13 numerals.~~ **Resolved (12)**: customer's `四` audio is missing; follow-up will add it.
- **Customer-side**: confirm the LWC names `zz_1` … `zz_10000` are acceptable. If the language community has preferred LWC strings (e.g. `one`, `two`, …), the proposal's `aa_wordlist.txt` rows can adopt those instead — purely a cosmetic identifier choice, no engine impact.
- **Customer-side**: confirm that the digit-on-plain-background placeholder PNGs are acceptable for v1, or whether the community will supply hand-drawn images later.
- **Customer-side**: clarify what `10 thousand.mp3` contains and whether it should ship anywhere. Will be asked in the issue-#28 follow-up comment.
- **Customer-side**: confirm the Cantonese reading of `萬` in the supplied clip — should be `maan6` (10000). If the clip is actually `wan6` or another reading, the listening game would teach the wrong association.
