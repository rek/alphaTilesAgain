import type { Meta, StoryObj } from '@storybook/react';
import { SudanScreen } from './SudanScreen';
import type { SudanCell } from './SudanScreen';

const COLORS = ['#666', '#1565C0', '#43A047', '#E53935', '#FB8C00', '#8E24AA', '#00897B'];

function tilesPage(count: number): SudanCell[] {
  const types = ['C', 'V', 'T', 'AD'];
  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length];
    const idx = type === 'C' ? 1 : type === 'V' ? 2 : type === 'T' ? 3 : 4;
    return { text: `${type}${i}`, color: COLORS[idx], tappable: true };
  });
}

function syllablesPage(count: number, tappable = true): SudanCell[] {
  return Array.from({ length: count }, (_, i) => ({
    text: `s${i}`,
    color: COLORS[(i % 5) + 1],
    tappable,
  }));
}

const meta: Meta<typeof SudanScreen> = {
  title: 'alphaTiles/feature-game-sudan/SudanScreen',
  component: SudanScreen,
  args: {
    page: 0,
    pageCount: 3,
    disabled: false,
    onPrev: () => undefined,
    onNext: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof SudanScreen>;

/** Tile variant — full 63-cell page (9x7 grid) on first page. */
export const TilesPageFull: Story = {
  args: {
    variant: 'T',
    tiles: tilesPage(63),
    page: 0,
    pageCount: 2,
    onTile: () => undefined,
  },
};

/** Tile variant — partial page (last page). */
export const TilesPagePartial: Story = {
  args: {
    variant: 'T',
    tiles: tilesPage(20),
    page: 1,
    pageCount: 2,
    onTile: () => undefined,
  },
};

/** Syllable variant — full 35-cell page (7x5 grid). */
export const SyllablesPageFull: Story = {
  args: {
    variant: 'S',
    syllables: syllablesPage(35),
    page: 0,
    pageCount: 3,
    onSyllable: () => undefined,
  },
};

/** Syllable variant — middle page; both arrows visible. */
export const SyllablesMiddlePage: Story = {
  args: {
    variant: 'S',
    syllables: syllablesPage(35),
    page: 1,
    pageCount: 3,
    onSyllable: () => undefined,
  },
};

/** Syllable variant — hasSyllableAudio=false, all cells muted/non-tappable. */
export const SyllablesNoAudio: Story = {
  args: {
    variant: 'S',
    syllables: syllablesPage(20, false),
    page: 0,
    pageCount: 1,
    onSyllable: () => undefined,
  },
};

/** Single-page state — neither arrow visible. */
export const SinglePage: Story = {
  args: {
    variant: 'T',
    tiles: tilesPage(12),
    page: 0,
    pageCount: 1,
    onTile: () => undefined,
  },
};

/** Empty/insufficient content — empty grid, single page. */
export const InsufficientContent: Story = {
  args: {
    variant: 'T',
    tiles: [],
    page: 0,
    pageCount: 1,
    onTile: () => undefined,
  },
};

/** Disabled while audio plays — taps swallowed. */
export const DisabledDuringPlayback: Story = {
  args: {
    variant: 'T',
    tiles: tilesPage(20),
    page: 0,
    pageCount: 2,
    disabled: true,
    onTile: () => undefined,
  },
};
