# AlphaTiles

Literacy-game generator: a language community's asset pack becomes a set of tile-based games in that language.

## Language

**Door**:
One playable game instance on the menu: an `aa_games.txt` row (game class + challenge level + tile/syllable mode + stage) resolved against the pack, identified by its 1-based row position (`index`, the route `doorIndex`). Resolved only by `@alphaTiles/data-doors` (`doorsOf`).
_Avoid_: game row, game number, level (for the whole door)

**Door name**: optional menu label for a Door, from the `GameName` column (9th) of `aa_games.txt`; `Door.name`. Pack content in the language of play, not chrome. Absent → unlabelled door.

**Game class**:
A mechanic (`aa_games.txt` Country, e.g. `UnitedStates`; kebab `classKey` `united-states`). Many Doors share one. Wired into the app only by the game-class registry (`apps/alphaTiles/src/gameClasses.ts`), which the one game route reads.
_Avoid_: game type, route (there is one route)

**Door progress**: one player's standing on one Door — points, tracker count, the 12-tracker bar, mastered, menu visual (`not-started` / `in-process` / `mastery`). Owned only by `@alphaTiles/data-door-progress` (`doorProgressOf`, `recordCorrectAnswer`, `nextUnmasteredDoor`, hooks `useDoorProgress` / `useDoorProgressOf`), keyed by `Door.progressKey(playerId)`.
_Avoid_: reading `useProgressStore` entries directly for a door.

**Tracker**: one of the 12 icons on the shell's tracker bar; a correct answer on a Door that tracks progress checks one. The count keeps going past 12; the bar stays full.

**Mastered**: a Door that tracks progress with ≥ 12 checked trackers (Java `Earth` / `hasChecked12Trackers`). Never depends on the "After 12 checked trackers" setting; no-right/wrong Doors are never mastered.
_Avoid_: completed, checked12, "finished game".

**Mastery action**: what the shell does when a correct answer checks the 12th tracker (and each 12th after) — `keep-playing` / `return-to-menu` / `celebrate-then-next-door`, from the "After 12 checked trackers" effective setting (1 / 2 / 3). Next door = first enabled, unmastered Door after this one in play order.

## Settings

**Player preferences**: sparse per-player overrides (`usePlayerPreferencesStore` in `@alphaTiles/data-players`); unset = pack default. Written only via `useSetPreference`.

**Effective settings**: the one lookup for cross-cutting settings — pack `aa_settings.txt` (labels + defaults defined once) with player preferences on top: `effectiveSettingsOf` / `useEffectiveSettings` (`@alphaTiles/data-settings`). _Avoid_: `settings.find*('<label>')` at call sites for these.

## Audio

**Pack speech**: the module games use to make pack content audible — `speak(item)`, `durationOf(item)`, `stop()` (`libs/alphaTiles/data-audio/src/lib/createPackSpeech.ts`; in games via `useGameShell().speak`). The only place that knows audio keys and fallbacks. _Avoid_: "play the word audio", audio key.

**Speech item**: what a game asks pack speech to say: `{ tile }`, `{ word }`, `{ syllable }` or `{ instruction }`, carrying the pack row (or InstructionAudio id). Never an audio key.

**Clip**: one recorded mp3 from the pack (`audio/tiles|words|syllables|instructions`), bound at boot under its domain id: tile → `tile.base`, word → `wordInLWC`, syllable → syllable text, instruction → InstructionAudio id. _Avoid_: AudioName (that's the pack column naming the file, not the bound id).

**Audio gate**: the web autoplay unlock — `<AudioGate>` in `data-audio`, around every route. Locked (tap-to-begin only, no screens) until a tap after preload; the tap primes all clips. Native: never locked. _Avoid_: web-gate phase, unlock gate on `/` only.

**Chime**: a bundled app sound (correct, incorrect, correct-final), not pack content; played via `useAudio()`.

**Syllable chain**: how pack speech says a word with no clip — each syllable clip of its LOP in order, 150 ms gap between. Used for the yue composite numerals (二十, 二百零三 …). Not a concatenation; the gap is a teaching cue.

**Decomposable word**: a word whose LOP parses into syllables that all have clips (`syllableChainFor` in `@shared/util-phoneme`). The binder accepts it without a word clip and the validator downgrades its missing clip to a warning.

**Containing-word fallback**: how pack speech says a syllable with no clip — the clip of the first word whose LOP contains it (Taiwan single hanzi).

**Composite numeral**: a yue number word with no recording of its own (`zz_20`, `zz_30`, `zz_50`, `zz_203`, `zz_1000000`); spoken as a syllable chain.
