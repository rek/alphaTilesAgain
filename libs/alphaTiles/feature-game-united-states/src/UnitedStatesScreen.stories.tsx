import type { Meta, StoryObj } from '@storybook/react';
import { UnitedStatesScreen } from './UnitedStatesScreen';
import type { TilePair } from './setupRound';

const THEME_COLORS = ['#9C27B0', '#2196F3', '#F44336', '#4CAF50', '#E91E63'];

function makePairs(word: string[]): TilePair[] {
  const alts = ['x', 'y', 'z', 'q', 'w', 'v', 'm', 'n', 'p'];
  return word.map((tile, i) => ({
    top: i % 2 === 0 ? tile : alts[i % alts.length],
    bottom: i % 2 === 0 ? alts[i % alts.length] : tile,
    correct: i % 2 === 0 ? ('top' as const) : ('bottom' as const),
  }));
}

const LEVEL1_PAIRS = makePairs(['c', 'a', 't', 's', 'i']);       // 5 tiles
const LEVEL3_PAIRS = makePairs(['b', 'r', 'e', 'a', 'd', 'f', 'r', 'u', 'i']); // 9 tiles
const CAT_PAIRS = makePairs(['c', 'a', 't']);

const meta: Meta<typeof UnitedStatesScreen> = {
  title: 'alphaTiles/feature-game-united-states/UnitedStatesScreen',
  component: UnitedStatesScreen,
  args: {
    themeColors: THEME_COLORS,
    wordImageSrc: undefined,
    wordLabel: 'cat',
    interactionLocked: false,
    onTilePress: () => undefined,
    onImagePress: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof UnitedStatesScreen>;

/** Level 1 board — 5 pairs, nothing selected. */
export const Level1Board: Story = {
  args: {
    pairs: LEVEL1_PAIRS,
    slotCount: 5,
    selections: [null, null, null, null, null],
    constructedWord: '_ _ _ _ _',
    wordLabel: 'satis',
  },
};

/** Level 3 board — 9 pairs, nothing selected. */
export const Level3Board: Story = {
  args: {
    pairs: LEVEL3_PAIRS,
    slotCount: 9,
    selections: [null, null, null, null, null, null, null, null, null],
    constructedWord: '_ _ _ _ _ _ _ _ _',
    wordLabel: 'breadfrui',
  },
};

/**
 * Partial selection — first two pairs selected. Demonstrates the cl1 layout
 * with a 3-tile word: 3 active pairs + 2 invisible placeholder slots.
 */
export const PartialSelection: Story = {
  args: {
    pairs: CAT_PAIRS,
    slotCount: 5,
    selections: [0, 1, null],
    constructedWord: 'ca_',
    wordLabel: 'cat',
  },
};

/** All correct — win state. */
export const AllSelectedCorrect: Story = {
  args: {
    pairs: CAT_PAIRS,
    slotCount: 5,
    selections: [0, 1, 0],
    constructedWord: 'cat',
    wordLabel: 'cat',
    interactionLocked: true,
  },
};

/** RTL layout — use logical style props. */
export const RTLLayout: Story = {
  args: {
    pairs: makePairs(['ب', 'ي', 'ت']),
    selections: [null, null, null],
    constructedWord: '_ _ _',
    slotCount: 5,
    wordLabel: 'بيت',
  },
  parameters: {
    locale: 'ar',
  },
};

/** Empty state — insufficient content. */
export const EmptyBoard: Story = {
  args: {
    pairs: [],
    selections: [],
    constructedWord: '',
    slotCount: 5,
    wordLabel: '',
    interactionLocked: true,
  },
};
