import type { Meta, StoryObj } from '@storybook/react';
import { ChileScreen } from './ChileScreen';
import type { ColorTile } from './evaluateGuess';

function empty(text = ''): ColorTile {
  return { text, color: 'EMPTY' };
}
function green(text: string): ColorTile {
  return { text, color: 'GREEN' };
}
function blue(text: string): ColorTile {
  return { text, color: 'BLUE' };
}
function gray(text: string): ColorTile {
  return { text, color: 'GRAY' };
}
function key(text: string): ColorTile {
  return { text, color: 'KEY' };
}

const WORD_LENGTH = 3;
const GUESS_COUNT = 6;
const KEYBOARD_WIDTH = 7;

const KEYS: ColorTile[] = ['b', 'a', 'n', 'g', 'o', 's', 't', 'r', 'e', 'l', 'd', 'c', 'p', 'h', 'w', 'f', 'i', 'u', 'm', 'k', 'y'].map(key);

// Empty board: all guess cells empty, all keys neutral
const EMPTY_TILES: ColorTile[] = Array.from({ length: GUESS_COUNT * WORD_LENGTH }, () => empty());

// Mid-game: first row evaluated (mixed), second row partially filled, rest empty
const MID_GAME_TILES: ColorTile[] = [
  gray('d'), blue('o'), gray('g'),  // row 1: evaluated
  empty('c'), empty('a'), empty(),  // row 2: partially filled
  ...Array.from({ length: (GUESS_COUNT - 2) * WORD_LENGTH }, () => empty()), // rows 3-6 empty
];

const MID_GAME_KEYS: ColorTile[] = KEYS.map((k) => {
  if (k.text === 'd' || k.text === 'g') return gray(k.text);
  if (k.text === 'o') return blue(k.text);
  return k;
});

// Won state: all tiles GREEN in row 1
const WON_TILES: ColorTile[] = [
  green('c'), green('a'), green('t'),
  ...Array.from({ length: (GUESS_COUNT - 1) * WORD_LENGTH }, () => empty()),
];

const WON_KEYS: ColorTile[] = KEYS.map((k) => {
  if (['c', 'a', 't'].includes(k.text)) return green(k.text);
  return k;
});

// Lost state: all rows used, last row + answer row appended in GREEN
const LOST_TILES: ColorTile[] = [
  gray('d'), gray('o'), gray('g'),
  gray('b'), gray('a'), gray('d'),
  gray('f'), gray('o'), gray('x'),
  gray('r'), gray('u'), gray('n'),
  gray('z'), gray('a'), gray('p'),
  gray('w'), gray('i'), gray('n'),
  // Answer row appended in GREEN (wordLength extra tiles)
  green('c'), green('a'), green('t'),
];

const meta: Meta<typeof ChileScreen> = {
  title: 'alphaTiles/feature-game-chile/ChileScreen',
  component: ChileScreen,
  args: {
    wordLength: WORD_LENGTH,
    guessCount: GUESS_COUNT,
    keyboardWidth: KEYBOARD_WIDTH,
    onKeyPress: () => undefined,
    onBackspace: () => undefined,
    onSubmitGuess: () => undefined,
    onReset: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof ChileScreen>;

/** Fresh board — all cells empty. */
export const EmptyBoard: Story = {
  args: {
    guessTiles: EMPTY_TILES,
    keyTiles: KEYS,
  },
};

/** Mid-game — first row evaluated, second row partially filled. */
export const MidGame: Story = {
  args: {
    guessTiles: MID_GAME_TILES,
    keyTiles: MID_GAME_KEYS,
  },
};

/** Won state — first row all GREEN, reset button shown. */
export const Won: Story = {
  args: {
    guessTiles: WON_TILES,
    keyTiles: WON_KEYS,
    showReset: true,
  },
};

/** Lost state — all rows used, answer revealed in GREEN below grid. */
export const Lost: Story = {
  args: {
    // Show LOST_TILES but guessCount+1 to accommodate answer row
    guessTiles: LOST_TILES,
    keyTiles: KEYS.map((k) => gray(k.text)),
    guessCount: GUESS_COUNT + 1,
    showReset: true,
  },
};

/** Multi-char tiles (e.g. Cantonese phonemes). */
export const MultiCharTiles: Story = {
  args: {
    wordLength: 3,
    guessCount: 4,
    guessTiles: [
      green('ba'), green('na'), green('na'),
      ...Array.from({ length: 3 * 3 }, () => empty()),
    ],
    keyTiles: ['ba', 'na', 'go', 'si', 'mo', 'ka', 'to'].map(key),
    showReset: true,
  },
};
