## ADDED Requirements

### Requirement: Memory matching grid with challenge-level scaling

The Mexico mechanic SHALL render a grid of cards that flip to reveal either the word's text (LOP) or its image. The number of pairs SHALL be derived from `challengeLevel` per `Mexico.java:91-106`:

- `challengeLevel === 1` (default) → 3 pairs (6 cards)
- `challengeLevel === 2` → 4 pairs (8 cards)
- `challengeLevel === 3` → 6 pairs (12 cards)
- `challengeLevel === 4` → 8 pairs (16 cards)
- `challengeLevel === 5` → 10 pairs (20 cards)

#### Scenario: Level 1 grid

- **WHEN** `<MexicoContainer>` mounts with `challengeLevel === 1`
- **THEN** the screen renders 6 face-down cards

#### Scenario: Level 5 grid

- **WHEN** `<MexicoContainer>` mounts with `challengeLevel === 5`
- **THEN** the screen renders 20 face-down cards

#### Scenario: Unknown challenge level falls back to default

- **WHEN** `<MexicoContainer>` mounts with `challengeLevel` not in `{1,2,3,4,5}`
- **THEN** the grid renders 6 face-down cards (Java `default: visibleGameButtons = 6`)

### Requirement: Pairs consist of one TEXT card and one IMAGE card

For each word chosen for the round, exactly two cards SHALL be created: one with `mode: 'TEXT'` displaying the word's LOP text, and one with `mode: 'IMAGE'` displaying the word's drawable. The full deck of `2 * pairCount` cards SHALL be shuffled before render. Ports `Mexico.java:162-216 chooseMemoryWords` + `Mexico.java:137 Collections.shuffle(memoryCollection)`.

#### Scenario: Card distribution

- **WHEN** a round starts with 3 pairs
- **THEN** the board contains 3 distinct words, with 2 cards per word (1 TEXT, 1 IMAGE), totaling 6 cards in shuffled order

#### Scenario: Words are deduplicated by LWC

- **GIVEN** the picker `chooseWord()` returns a word whose `wordInLWC` already appears in the deck
- **WHEN** `chooseMemoryWords` evaluates it
- **THEN** that word is rejected and the picker is retried (Java `i--` in line 181 plus `wordAcceptable` flag)

### Requirement: Card-tap state machine with reveal delay

The mechanic SHALL track card flips per `Mexico.java:219-265 respondToCardSelection`:

1. Tapping a face-down card flips it to `REVEALED` (and increments `activeSelections`).
2. Tapping a card already in `PAIRED` state SHALL be a no-op (Java line 222-227 early return).
3. Tapping the same card index twice while one selection is active SHALL be a no-op (Java line 229-233 early return).
4. When the second card is revealed (`activeSelections === 2`), the board SHALL lock and after 800ms the match check SHALL run (Java line 261-262 `postDelayed(quickViewDelay, 800L)`).

#### Scenario: First tap reveals card

- **GIVEN** all cards are face-down
- **WHEN** the player taps card index 0
- **THEN** card 0 transitions to `REVEALED` (showing TEXT or IMAGE)

#### Scenario: Tapping a paired card is ignored

- **GIVEN** card index 0 is in `PAIRED` state
- **WHEN** the player taps card index 0
- **THEN** no state change occurs and the board remains interactive

#### Scenario: Tapping the same card twice during one active selection is ignored

- **GIVEN** card index 0 is `REVEALED` and `activeSelections === 1`
- **WHEN** the player re-taps card index 0
- **THEN** no second selection is registered

#### Scenario: Second tap locks the board for 800ms

- **GIVEN** one card is already `REVEALED`
- **WHEN** the player taps a different face-down card
- **THEN** the board becomes unclickable and the match check fires after 800ms

### Requirement: Match comparison and successful pair

The match check SHALL compare the two selected cards by `wordInLWC` (the unstripped LWC word, Java line 292 `memoryCollection.get(cardHitA)[0].equals(memoryCollection.get(cardHitB)[0])`). On match:

- Both cards transition to `PAIRED`.
- Both cards display the stripped LOP text (Java `wordList.stripInstructionCharacters`).
- Both cards' text color is the theme color `colorList[cardHitA % 5]` (Java line 307).
- The active `refWord` is updated to the matched word so the audio sequence plays the right clip.
- `playCorrectSoundThenActiveWordClip(isFinalPair)` runs — correct chime followed by the word's audio clip.

#### Scenario: Successful match shows text in theme color

- **GIVEN** the player flips a TEXT card and an IMAGE card whose `wordInLWC` are equal
- **WHEN** the 800ms reveal delay elapses
- **THEN** both cards transition to `PAIRED`, show the stripped LOP text, and use color `colorList[cardHitA % 5]`

#### Scenario: Non-final match plays correct chime then word audio

- **GIVEN** a non-final pair just matched
- **WHEN** the audio sequence runs
- **THEN** `audio.playCorrect()` plays followed by `audio.playWord(matchedWord.wordInLWC)` (no celebration)

### Requirement: Mismatch flip-back with settings-driven delay

When the two selected cards do not match (Java line 331-340), the mechanic SHALL keep both cards revealed for `flipBackDelay` milliseconds, then revert both to `HIDDEN`. The delay SHALL be read from `assets.settings["View memory cards for _ milliseconds"]`; if absent or empty, the delay defaults to **0** (Java line 332-336 `long delay = 0; if (!delaySetting.equals("")) delay = Long.valueOf(delaySetting);`).

#### Scenario: Mismatch with no settings entry flips immediately

- **GIVEN** the two selected cards do not match and `assets.settings["View memory cards for _ milliseconds"]` is absent
- **WHEN** the 800ms reveal delay elapses
- **THEN** both cards revert to `HIDDEN` immediately (delay = 0)

#### Scenario: Mismatch honors settings-provided delay

- **GIVEN** `assets.settings["View memory cards for _ milliseconds"] === "1500"`
- **WHEN** the cards do not match
- **THEN** both cards stay revealed for 1500ms before reverting to `HIDDEN`

### Requirement: Win condition awards points equal to pair count

When `pairsCompleted === visibleGameButtons / 2`, the mechanic SHALL invoke `shell.incrementPointsAndTracker` with the pair count (Java line 324-325 `updatePointsAndTrackers((visibleGameButtons / 2))`) — i.e., 3, 4, 6, 8, or 10 points depending on `challengeLevel`. The advance arrow SHALL turn blue and `playCorrectSoundThenActiveWordClip(true)` SHALL run on the final pair (correct chime + word audio + final/celebration flag).

#### Scenario: Last pair found at level 2

- **WHEN** the player matches the final pair in a 4-pair (level 2) game
- **THEN** `shell.incrementPointsAndTracker` is invoked with `4` and the celebration sequence runs

#### Scenario: Last pair found at level 5

- **WHEN** the player matches the final pair in a 10-pair (level 5) game
- **THEN** `shell.incrementPointsAndTracker` is invoked with `10` and the advance arrow turns blue

### Requirement: Precompute for asset availability

The Mexico mechanic SHALL register a precompute under key `'mexico'` that filters `wordList` to words having both a drawable image and an audio clip (`lwcWordHashMap.get(wordInLWC).duration` exists and image resource resolves). If fewer than `pairCount` valid words exist, the round SHALL fall back per Java's sanity loop (line 209-214: after `cardsToSetUp * 3` iterations without success, log a warning and exit to home / show "not enough content").

#### Scenario: Insufficient words shows fallback

- **GIVEN** a pack has only 5 words with both image and audio, but `challengeLevel === 5` (requires 10)
- **WHEN** `chooseMemoryWords` exceeds `cardsToSetUp * 3` retries without filling the deck
- **THEN** a "not enough content" empty/locked screen is rendered (analog to Java `goBackToEarth(null)`)

### Requirement: Container/presenter split

`<MexicoContainer>` SHALL own all hook usage (`useGameShell`, `usePrecompute`, `useLangAssets`, `useAudio`) and state. `<MexicoScreen>` SHALL be a pure props→JSX presenter with no `react-i18next` import and no hooks beyond `useWindowDimensions` for sizing.

#### Scenario: Presenter has no i18n imports

- **WHEN** `MexicoScreen.tsx` is statically analyzed
- **THEN** it MUST NOT import `react-i18next`
