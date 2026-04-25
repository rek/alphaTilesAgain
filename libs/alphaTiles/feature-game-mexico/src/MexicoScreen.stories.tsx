import type { Meta, StoryObj } from '@storybook/react';
import { MexicoScreen } from './MexicoScreen';
import type { CardState } from './setupMexicoBoard';

// Storybook uses a remote URI; prod uses Metro require-id from assets.images.icon
const LOGO = { uri: 'https://picsum.photos/seed/logo/200' };

function hidden(word: string): CardState {
  return { word: { wordInLWC: word, wordInLOP: word }, mode: 'TEXT', status: 'HIDDEN' };
}
function revealedText(word: string, wordInLOP?: string): CardState {
  return {
    word: { wordInLWC: word, wordInLOP: wordInLOP ?? word },
    mode: 'TEXT',
    status: 'REVEALED',
  };
}
function revealedImage(word: string): CardState {
  return { word: { wordInLWC: word, wordInLOP: word }, mode: 'IMAGE', status: 'REVEALED' };
}
function paired(word: string, mode: 'TEXT' | 'IMAGE' = 'TEXT'): CardState {
  return { word: { wordInLWC: word, wordInLOP: word }, mode, status: 'PAIRED' };
}

const SIX_CARDS: CardState[] = [
  hidden('cat'),
  hidden('dog'),
  hidden('sun'),
  revealedText('cat'),
  revealedImage('dog'),
  hidden('sun'),
];

const TWELVE_CARDS: CardState[] = [
  'apple', 'bird', 'cat', 'dog', 'egg', 'fish',
].flatMap((w) => [hidden(w), hidden(w)]);

const PARTIAL_MATCH: CardState[] = [
  paired('cat', 'TEXT'),
  paired('cat', 'IMAGE'),
  revealedText('dog'),
  revealedImage('dog'),
  hidden('sun'),
  hidden('sun'),
];

const ALL_PAIRED: CardState[] = [
  'apple', 'bird', 'cat',
].flatMap((w) => [paired(w, 'TEXT'), paired(w, 'IMAGE')]);

const meta: Meta<typeof MexicoScreen> = {
  title: 'alphaTiles/feature-game-mexico/MexicoScreen',
  component: MexicoScreen,
  args: {
    wordImages: {},
    logoSource: LOGO,
    themeColor: '#4CAF50',
    interactionLocked: false,
    onCardPress: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof MexicoScreen>;

/** Fresh 6-card board (level 1). All cards face-down. */
export const SixCardsFaceDown: Story = {
  args: {
    cards: ['cat', 'dog', 'sun'].flatMap((w) => [hidden(w), hidden(w)]),
  },
};

/** Two cards flipped, none matched yet. */
export const TwoRevealed: Story = {
  args: {
    cards: SIX_CARDS,
  },
};

/** One pair matched, another being revealed. */
export const PartialMatch: Story = {
  args: {
    cards: PARTIAL_MATCH,
    themeColor: '#1565C0',
  },
};

/** All 6 cards paired — win state. */
export const AllPaired: Story = {
  args: {
    cards: ALL_PAIRED,
    themeColor: '#E91E63',
  },
};

/** 12-card board (level 3). */
export const TwelveCards: Story = {
  args: {
    cards: TWELVE_CARDS,
  },
};

/** Interaction locked (e.g. during reveal delay). */
export const Locked: Story = {
  args: {
    cards: SIX_CARDS,
    interactionLocked: true,
  },
};

/** Empty board — insufficient content error state. */
export const Empty: Story = {
  args: {
    cards: [],
  },
};

/** Yellow theme color — verifies contrast-aware text. */
export const YellowTheme: Story = {
  args: {
    cards: ALL_PAIRED,
    themeColor: '#FFFF00',
  },
};
