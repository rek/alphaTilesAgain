import type { Meta, StoryObj } from '@storybook/react';
import { MyanmarScreen } from './MyanmarScreen';
import type { MyanmarCell, MyanmarImageSlot } from './MyanmarScreen';

const IMG = (seed: string) => ({ uri: `https://picsum.photos/seed/${seed}/120` });

function makeGrid(text: string[], colors: (string | null)[] = [], selected: number[] = []): MyanmarCell[] {
  const sel = new Set(selected);
  return text.map((t, i) => ({
    text: t,
    color: colors[i] ?? null,
    selected: sel.has(i),
  }));
}

// 7×7 = 49 cells. Rows separated for readability.
const FRESH_TEXT = [
  'c','a','t','x','d','o','g',
  'b','i','r','d','y','z','q',
  'f','i','s','h','m','p','n',
  'h','o','r','s','e','j','k',
  'a','n','t','u','v','w','l',
  'e','g','r','t','y','u','i',
  's','d','f','g','h','j','k',
];

const FRESH_BANK: MyanmarImageSlot[] = [
  { source: IMG('cat'), label: 'cat', done: false },
  { source: IMG('dog'), label: 'dog', done: false },
  { source: IMG('fish'), label: 'fish', done: false },
  { source: IMG('bird'), label: 'bird', done: false },
  { source: IMG('horse'), label: 'horse', done: false },
  { source: IMG('ant'), label: 'ant', done: false },
  { source: IMG('mouse'), label: 'mouse', done: false },
];

const meta: Meta<typeof MyanmarScreen> = {
  title: 'alphaTiles/feature-game-myanmar/MyanmarScreen',
  component: MyanmarScreen,
  args: {
    activeWord: '',
    interactionLocked: false,
    onCellPress: () => undefined,
    onImagePress: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof MyanmarScreen>;

/** Fresh board — no found words, no in-flight selection. */
export const Default: Story = {
  args: {
    grid: makeGrid(FRESH_TEXT),
    imageBank: FRESH_BANK,
  },
};

/** Method 1 (classic) mid-tap: first cell selected, awaiting second. */
export const ClassicFirstTapped: Story = {
  args: {
    grid: makeGrid(FRESH_TEXT, [], [0]),
    imageBank: FRESH_BANK,
  },
};

/** Method 2 (stack) building a sequence — 4 adjacent cells highlighted in same direction. */
export const StackBuilding: Story = {
  args: {
    grid: makeGrid(FRESH_TEXT, [], [0, 1, 2, 3]),
    imageBank: FRESH_BANK,
  },
};

/** Mid-game: 3 words found (each in a different palette colour), 4 image slots cleared. */
export const MidGame: Story = {
  args: {
    grid: makeGrid(
      FRESH_TEXT,
      [
        '#1565C0','#1565C0','#1565C0', null, null, null, null, // row 0: cat
        null,null,null,null,null,null,null,
        '#43A047','#43A047','#43A047','#43A047', null, null, null, // row 2: fish
        '#E53935','#E53935','#E53935','#E53935','#E53935', null, null, // row 3: horse
        null,null,null,null,null,null,null,
        null,null,null,null,null,null,null,
        null,null,null,null,null,null,null,
      ],
    ),
    activeWord: 'horse',
    imageBank: [
      { source: undefined, label: 'cat', done: true },
      { source: IMG('dog'), label: 'dog', done: false },
      { source: undefined, label: 'fish', done: true },
      { source: IMG('bird'), label: 'bird', done: false },
      { source: undefined, label: 'horse', done: true },
      { source: IMG('ant'), label: 'ant', done: false },
      { source: IMG('mouse'), label: 'mouse', done: false },
    ],
  },
};

/** Completed: every word found, every slot cleared, interaction locked while end-audio plays. */
export const Completed: Story = {
  args: {
    grid: makeGrid(
      FRESH_TEXT,
      Array.from({ length: 49 }, (_, i) =>
        i < 7 ? '#1565C0' :
        i >= 14 && i < 18 ? '#43A047' :
        i >= 21 && i < 26 ? '#E53935' :
        i >= 28 && i < 31 ? '#FB8C00' :
        null,
      ),
    ),
    activeWord: 'mouse',
    interactionLocked: true,
    imageBank: FRESH_BANK.map((s) => ({ ...s, done: true, source: undefined })),
  },
};

/** Insufficient content: empty placement (no words could be placed). */
export const InsufficientContent: Story = {
  args: {
    grid: makeGrid(Array.from({ length: 49 }, () => '?')),
    imageBank: [],
    interactionLocked: true,
  },
};
