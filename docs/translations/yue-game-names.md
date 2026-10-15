# yue game names: template for the content team

The Cantonese app menu shows each game as a coloured door with a number. Issue [#37](https://github.com/rek/alphaTilesAgain/issues/37): label each door with a short game name in Cantonese. **The app is ready for the names. Only the text is missing.**

## What we need

One short Cantonese name per door, written in Traditional Chinese characters. Please fill in the last column of the table below.

- **Keep it short.** The door is small on a phone. **6 characters or fewer** is best; more than 12 may be cut off (the pack checker warns).
- **Say what the child does**, not how hard it is. Easy / medium / hard versions of the same game can share a name (the door number and colour tell them apart), or add a short marker such as 一, 二, 三 if you prefer.
- **Doors left blank stay unlabelled** (number only), exactly as today. Partial lists are fine.
- Players can turn names off in Settings ("Show game names on doors") for children who use colours instead.

## Where the names go

Column 9 `GameName` of `languages/yue/aa_games.txt` (header already added; rows are empty). Paste each name at the end of its row after a tab. Door number = row number = first column.

## Doors

| door | game (level) | mode | what the player does | Cantonese name |
|---|---|---|---|---|
| 1 | Thailand (level 165) | Tile (T) | **Word listening — Easy.** Plays a Cantonese word aloud. The student picks the matching picture from four options. Distractor pictures are loosely related. | |
| 2 | Thailand (level 265) | Tile (T) | **Word listening — Medium.** Same format as the easy version — hear a word, pick the picture — but distractors share more features with the correct answer. | |
| 3 | Thailand (level 365) | Tile (T) | **Word listening — Hard.** Same hear-a-word, pick-a-picture format with the hardest distractors. The distractors sound or look similar to the correct answer. | |
| 4 | Thailand (level 234) | Tile (T) | **Listen and read.** Plays a Cantonese word aloud. The student picks its written form from four choices (no picture cue). | |
| 5 | Thailand (level 364) | Tile (T) | **Listen and read — Hard.** Plays a Cantonese word aloud. The student picks its written form from four choices (no picture cue) with the hardest distractors. | |
| 6 | Taiwan (level 1) | Tile (T) | **Stroke order — Guided.** The character outline is shown with numbered start dots. The student traces each stroke with finger or mouse. Forgiving accuracy. | |
| 7 | Taiwan (level 2) | Tile (T) | **Stroke order — Outline.** The character outline is still shown but the numbered start dots are removed. Default stroke accuracy. | |
| 8 | Taiwan (level 3) | Tile (T) | **Stroke order — From memory.** No outline shown. The student writes the character from memory on a blank canvas. Strict stroke matching. | |
| 9 | Georgia (level 1) | Syllable (S) | **First-syllable identification.** Plays a Cantonese word, then plays its first character on its own. The student picks that first character from six choices. | |
| 10 | Georgia (level 2) | Syllable (S) | **First-syllable identification — 12 choices.** Same listen-then-tap format as the 6-choice door, but the student must find the correct first character in a grid of twelve. | |
| 11 | Georgia (level 3) | Syllable (S) | **First-syllable identification — 18 choices.** Same listen-then-tap format with the largest choice grid: eighteen syllables, roughly a third of the full pool visible per round. | |
| 12 | Mexico (level 1) | Tile (T) | **Memory pairs — 3 pairs.** Face-down cards. Each word appears twice: once as its written form and once as its picture. The student flips two at a time to match word to picture. | |
| 13 | Mexico (level 2) | Tile (T) | **Memory pairs — 4 pairs.** Same word-to-picture memory game with four pairs (eight cards). | |
| 14 | Mexico (level 3) | Tile (T) | **Memory pairs — 6 pairs.** Same word-to-picture memory game with six pairs (twelve cards). | |
| 15 | Ecuador (level 1) | Tile (T) | **Find the word.** Shows a picture with eight written words scattered around it. The student taps the word that names the picture. | |
| 16 | Thailand (level 145) | Tile (T) | **Read and pick the picture — Easy.** Shows a written word (no audio). The student picks its picture from four choices. Distractors are random. | |
| 17 | Thailand (level 245) | Tile (T) | **Read and pick the picture — Medium.** Same read-then-pick-the-picture format, but the distractor pictures come from the same topic (e.g. other family members). | |
| 18 | Thailand (level 154) | Tile (T) | **Picture to writing — Easy.** Shows a picture. The student picks the written word for it from four choices (no audio cue). Distractors are random. | |
| 19 | Thailand (level 254) | Tile (T) | **Picture to writing — Medium.** Same picture-to-written-word format, but the distractor words come from the same topic. | |
| 20 | Colombia (level 1) | Syllable (S) | **Build the word — Easy.** Shows a picture and plays the word. The student taps characters in order to build the written word. Only the word's own characters are on the keyboard. | |
| 21 | Colombia (level 2) | Syllable (S) | **Build the word — Medium.** Same build-the-word format, with extra distractor characters mixed into the keyboard. | |
| 22 | Colombia (level 3) | Syllable (S) | **Build the word — Hard.** Same build-the-word format with an 18-character keyboard, most of them distractors. | |
| 23 | Brazil (level 1) | Syllable (S) | **Missing character.** Shows a picture and the written word with one character blanked out, and plays the word. The student picks the missing character from four choices. | |
| 24 | Italy (level 1) | Tile (T) | **Listening bingo — words.** A 4×4 board of written words. A word is called out; the student marks it on the board. Four in a row wins. | |
| 25 | Italy (level 1) | Syllable (S) | **Listening bingo — characters.** Same bingo format with single characters: a character is called out and the student marks it on a 4×4 board. | |
| 26 | Malaysia (level 1) | Tile (T) | **Word browser.** Pages of words with their pictures. Tap any word to hear it. Nothing is scored. | |
| 27 | Sudan (level 1) | Syllable (S) | **Character browser.** Pages of every character in the pack. Tap a character to hear it on its own. Nothing is scored. | |
| 28 | Iraq (level 1) | Tile (T) | **Word explorer.** Pages of written words. Tap one to hear it and see its picture. Nothing is scored. | |

Descriptions come from the Cantonese game guide (`apps/home/src/app/cantoneseGuide.tsx`). Door list matches `languages/yue/aa_games.txt` at the time of writing. If doors are added or reordered, regenerate this table from that file.
